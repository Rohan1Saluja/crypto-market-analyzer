from fastapi import APIRouter, Response, status

from app.api.dependencies import CurrentUserDep, SessionDep, WatchlistServiceDep
from app.schemas.user import CurrentUser
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
