from decimal import Decimal
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.wallet import TrackedWallet, WalletPosition
from app.schemas.exposure import WalletHoldingsSnapshot


class WalletRepository:
    def list_for_user(
        self,
        *,
        session: Session,
        user_id: UUID,
    ) -> list[TrackedWallet]:
        return list(
            session.scalars(
                select(TrackedWallet)
                .where(TrackedWallet.user_id == user_id)
                .order_by(TrackedWallet.created_at.asc()),
            ),
        )

    def get_for_user(
        self,
        *,
        session: Session,
        user_id: UUID,
        wallet_id: UUID,
        for_update: bool = False,
    ) -> TrackedWallet | None:
        statement = select(TrackedWallet).where(
            TrackedWallet.id == wallet_id,
            TrackedWallet.user_id == user_id,
        )
        if for_update:
            statement = statement.with_for_update()

        return session.scalar(statement)

    def create(
        self,
        *,
        session: Session,
        user_id: UUID,
        address: str,
        label: str | None,
    ) -> TrackedWallet:
        wallet = TrackedWallet(
            user_id=user_id,
            address=address,
            label=label,
        )
        session.add(wallet)
        session.flush()
        return wallet

    def delete(
        self,
        *,
        session: Session,
        wallet: TrackedWallet,
    ) -> None:
        session.delete(wallet)

    def replace_positions(
        self,
        *,
        session: Session,
        wallet: TrackedWallet,
        snapshot: WalletHoldingsSnapshot,
    ) -> None:
        session.execute(
            delete(WalletPosition).where(
                WalletPosition.wallet_id == wallet.id,
            ),
        )

        session.add_all(
            [
                WalletPosition(
                    wallet_id=wallet.id,
                    network_id=holding.network_id,
                    asset_kind=holding.asset_kind,
                    asset_reference=holding.asset_reference,
                    name=holding.name,
                    symbol=holding.symbol,
                    decimals=holding.decimals,
                    raw_balance=Decimal(holding.raw_balance),
                    observed_at=snapshot.observed_at,
                )
                for holding in snapshot.positions
            ],
        )
