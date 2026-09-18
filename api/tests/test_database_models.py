from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import User, WatchlistItem


def make_session() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    return Session(engine)


def test_user_can_persist_watchlist_item() -> None:
    with make_session() as session:
        user = User(email="rohan@example.com", display_name="Rohan")
        user.watchlist_items.append(
            WatchlistItem(asset_id="bitcoin", thesis="Track long-term adoption."),
        )
        session.add(user)
        session.commit()

        stored_user = session.scalar(select(User).where(User.email == "rohan@example.com"))

        assert stored_user is not None
        assert stored_user.watchlist_items[0].asset_id == "bitcoin"
        assert stored_user.watchlist_items[0].thesis == "Track long-term adoption."


def test_watchlist_asset_is_unique_per_user() -> None:
    with make_session() as session:
        user = User(email="rohan@example.com")
        user.watchlist_items.extend(
            [
                WatchlistItem(asset_id="bitcoin"),
                WatchlistItem(asset_id="bitcoin"),
            ],
        )
        session.add(user)

        try:
            session.commit()
        except IntegrityError:
            session.rollback()
        else:
            raise AssertionError("duplicate watchlist assets must violate the unique constraint")
