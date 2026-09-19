from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import (
    WalletAlreadyTrackedError,
    WalletNotFoundError,
    WalletPortfolioProviderError,
    WalletSnapshotMismatchError,
)
from app.domain.wallet import (
    ETHEREUM_MAINNET_NETWORK_ID,
    normalize_evm_address,
)
from app.models.user import User
from app.models.wallet import TrackedWallet
from app.providers.base import WalletPortfolioProvider
from app.repositories.wallet_repository import WalletRepository


class WalletService:
    def __init__(
        self,
        *,
        repository: WalletRepository,
        provider: WalletPortfolioProvider,
    ) -> None:
        self._repository = repository
        self._provider = provider

    def list_wallets(
        self,
        *,
        session: Session,
        user: User,
    ) -> list[TrackedWallet]:
        return self._repository.list_for_user(
            session=session,
            user_id=user.id,
        )

    def create_wallet(
        self,
        *,
        session: Session,
        user: User,
        address: str,
        label: str | None,
    ) -> TrackedWallet:
        normalized_address = normalize_evm_address(address)
        normalized_label = label.strip() if label and label.strip() else None

        try:
            wallet = self._repository.create(
                session=session,
                user_id=user.id,
                address=normalized_address,
                label=normalized_label,
            )
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise WalletAlreadyTrackedError(
                "This wallet is already tracked by your Calyrn account"
            ) from exc

        session.refresh(wallet)
        return wallet

    def delete_wallet(
        self,
        *,
        session: Session,
        user: User,
        wallet_id: UUID,
    ) -> None:
        wallet = self._repository.get_for_user(
            session=session,
            user_id=user.id,
            wallet_id=wallet_id,
        )
        if wallet is None:
            raise WalletNotFoundError("Tracked wallet not found")

        self._repository.delete(session=session, wallet=wallet)
        session.commit()

    def refresh_wallet(
        self,
        *,
        session: Session,
        user: User,
        wallet_id: UUID,
    ) -> tuple[TrackedWallet, int]:
        user_id = user.id
        wallet = self._repository.get_for_user(
            session=session,
            user_id=user_id,
            wallet_id=wallet_id,
        )
        if wallet is None:
            raise WalletNotFoundError("Tracked wallet not found")

        tracked_address = wallet.address

        # CurrentUserDep and the ownership lookup both use this Session. End the
        # read transaction before waiting on an external provider so no database
        # transaction remains open during network I/O.
        session.rollback()

        try:
            snapshot = self._provider.get_wallet_snapshot(
                address=tracked_address,
                network_id=ETHEREUM_MAINNET_NETWORK_ID,
            )
        except WalletPortfolioProviderError as exc:
            self._record_failed_refresh(
                session=session,
                user_id=user_id,
                wallet_id=wallet_id,
                error_code=type(exc).__name__,
            )
            raise

        if snapshot.address != tracked_address:
            self._record_failed_refresh(
                session=session,
                user_id=user_id,
                wallet_id=wallet_id,
                error_code="snapshot_address_mismatch",
            )
            raise WalletSnapshotMismatchError(
                "Wallet snapshot address does not match the tracked wallet"
            )

        wallet = self._repository.get_for_user(
            session=session,
            user_id=user_id,
            wallet_id=wallet_id,
            for_update=True,
        )
        if wallet is None:
            session.rollback()
            raise WalletNotFoundError("Tracked wallet not found")

        now = datetime.now(UTC)
        wallet.last_sync_attempt_at = now
        wallet.last_synced_at = snapshot.observed_at
        wallet.sync_status = "success"
        wallet.last_sync_error_code = None

        self._repository.replace_positions(
            session=session,
            wallet=wallet,
            snapshot=snapshot,
        )

        try:
            session.commit()
        except Exception:
            session.rollback()
            raise

        session.refresh(wallet)
        return wallet, len(snapshot.positions)

    def _record_failed_refresh(
        self,
        *,
        session: Session,
        user_id: UUID,
        wallet_id: UUID,
        error_code: str,
    ) -> None:
        session.rollback()
        wallet = self._repository.get_for_user(
            session=session,
            user_id=user_id,
            wallet_id=wallet_id,
            for_update=True,
        )
        if wallet is None:
            session.rollback()
            return

        wallet.last_sync_attempt_at = datetime.now(UTC)
        wallet.sync_status = "failed"
        wallet.last_sync_error_code = error_code[:64]

        try:
            session.commit()
        except Exception:
            session.rollback()
