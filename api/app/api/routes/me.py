from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status

from app.api.dependencies import (
    CurrentUserDep,
    ExposureServiceDep,
    SessionDep,
    WalletServiceDep,
    WatchlistServiceDep,
)
from app.core.exceptions import (
    WalletAlreadyTrackedError,
    WalletNotFoundError,
    WalletSnapshotMismatchError,
)
from app.domain.wallet import InvalidWalletAddressError
from app.schemas.exposure import ExposureReadModel
from app.schemas.user import CurrentUser
from app.schemas.wallet import (
    TrackedWalletCreate,
    TrackedWalletRead,
    WalletRefreshResult,
)
from app.schemas.watchlist import WatchlistItemRead, WatchlistItemUpsert

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=CurrentUser)
def get_me(current_user: CurrentUserDep) -> CurrentUser:
    return CurrentUser.model_validate(current_user)


@router.get("/watchlist", response_model=list[WatchlistItemRead])
def get_watchlist(
    current_user: CurrentUserDep,
    session: SessionDep,
    service: WatchlistServiceDep,
) -> list[WatchlistItemRead]:
    items = service.list_items(session=session, user=current_user)
    return [WatchlistItemRead.model_validate(item) for item in items]


@router.put("/watchlist/{asset_id}", response_model=WatchlistItemRead)
def put_watchlist_item(
    asset_id: str,
    payload: WatchlistItemUpsert,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: WatchlistServiceDep,
) -> WatchlistItemRead:
    item = service.put_item(
        session=session,
        user=current_user,
        asset_id=asset_id,
        thesis=payload.thesis,
    )
    return WatchlistItemRead.model_validate(item)


@router.delete("/watchlist/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_watchlist_item(
    asset_id: str,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: WatchlistServiceDep,
) -> Response:
    service.delete_item(session=session, user=current_user, asset_id=asset_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/wallets", response_model=list[TrackedWalletRead])
def get_wallets(
    current_user: CurrentUserDep,
    session: SessionDep,
    service: WalletServiceDep,
) -> list[TrackedWalletRead]:
    wallets = service.list_wallets(session=session, user=current_user)
    return [TrackedWalletRead.model_validate(wallet) for wallet in wallets]


@router.post(
    "/wallets",
    response_model=TrackedWalletRead,
    status_code=status.HTTP_201_CREATED,
)
def create_wallet(
    payload: TrackedWalletCreate,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: WalletServiceDep,
) -> TrackedWalletRead:
    try:
        wallet = service.create_wallet(
            session=session,
            user=current_user,
            address=payload.address,
            label=payload.label,
        )
    except InvalidWalletAddressError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc
    except WalletAlreadyTrackedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return TrackedWalletRead.model_validate(wallet)


@router.delete("/wallets/{wallet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wallet(
    wallet_id: UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: WalletServiceDep,
) -> Response:
    try:
        service.delete_wallet(
            session=session,
            user=current_user,
            wallet_id=wallet_id,
        )
    except WalletNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/wallets/{wallet_id}/refresh",
    response_model=WalletRefreshResult,
)
def refresh_wallet(
    wallet_id: UUID,
    current_user: CurrentUserDep,
    session: SessionDep,
    service: WalletServiceDep,
) -> WalletRefreshResult:
    try:
        wallet, position_count = service.refresh_wallet(
            session=session,
            user=current_user,
            wallet_id=wallet_id,
        )
    except WalletNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except WalletSnapshotMismatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Wallet provider returned an inconsistent snapshot",
        ) from exc

    return WalletRefreshResult(
        wallet=TrackedWalletRead.model_validate(wallet),
        position_count=position_count,
    )


@router.get("/exposure", response_model=ExposureReadModel)
def get_exposure(
    current_user: CurrentUserDep,
    session: SessionDep,
    service: ExposureServiceDep,
) -> ExposureReadModel:
    return service.get_exposure(
        session=session,
        user=current_user,
    )
