from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.watchlist import WatchlistItem


class WatchlistService:
    def list_items(self, *, session: Session, user: User) -> list[WatchlistItem]:
        return list(
            session.scalars(
                select(WatchlistItem)
                .where(WatchlistItem.user_id == user.id)
                .order_by(WatchlistItem.created_at.asc()),
            ),
        )

    def put_item(
        self,
        *,
        session: Session,
        user: User,
        asset_id: str,
        thesis: str | None,
    ) -> WatchlistItem:
        item = session.scalar(
            select(WatchlistItem).where(
                WatchlistItem.user_id == user.id,
                WatchlistItem.asset_id == asset_id,
            ),
        )

        if item is None:
            item = WatchlistItem(user_id=user.id, asset_id=asset_id, thesis=thesis)
            session.add(item)
        else:
            item.thesis = thesis

        session.commit()
        session.refresh(item)
        return item

    def delete_item(self, *, session: Session, user: User, asset_id: str) -> bool:
        item = session.scalar(
            select(WatchlistItem).where(
                WatchlistItem.user_id == user.id,
                WatchlistItem.asset_id == asset_id,
            ),
        )
        if item is None:
            return False

        session.delete(item)
        session.commit()
        return True
