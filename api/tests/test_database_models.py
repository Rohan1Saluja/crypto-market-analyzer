from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import TrackedWallet, User, WalletPosition, WatchlistItem


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


def test_user_can_persist_wallet_position() -> None:
    with make_session() as session:
        user = User(email="wallet@example.com")
        wallet = TrackedWallet(
            address="0xabcdef0123456789abcdef0123456789abcdef01",
            label="Primary",
        )
        wallet.positions.append(
            WalletPosition(
                network_id="eip155:1",
                asset_kind="native",
                asset_reference="native",
                name="Ether",
                symbol="ETH",
                decimals=18,
                raw_balance=Decimal("1230000000000000000"),
                observed_at=datetime.now(UTC),
            ),
        )
        user.tracked_wallets.append(wallet)
        session.add(user)
        session.commit()

        stored_wallet = session.scalar(
            select(TrackedWallet).where(TrackedWallet.user_id == user.id),
        )

        assert stored_wallet is not None
        assert stored_wallet.address_family == "evm"
        assert stored_wallet.sync_status == "never"
        assert stored_wallet.positions[0].network_id == "eip155:1"
        assert stored_wallet.positions[0].raw_balance == Decimal(
            "1230000000000000000"
        )


def test_wallet_address_is_unique_per_user_and_family() -> None:
    with make_session() as session:
        user = User(email="wallet@example.com")
        user.tracked_wallets.extend(
            [
                TrackedWallet(
                    address="0xabcdef0123456789abcdef0123456789abcdef01"
                ),
                TrackedWallet(
                    address="0xabcdef0123456789abcdef0123456789abcdef01"
                ),
            ],
        )
        session.add(user)

        try:
            session.commit()
        except IntegrityError:
            session.rollback()
        else:
            raise AssertionError("duplicate tracked wallets must violate the unique constraint")


def test_same_wallet_can_be_tracked_by_different_users() -> None:
    with make_session() as session:
        address = "0xabcdef0123456789abcdef0123456789abcdef01"
        session.add_all(
            [
                User(
                    email="alice@example.com",
                    tracked_wallets=[TrackedWallet(address=address)],
                ),
                User(
                    email="bob@example.com",
                    tracked_wallets=[TrackedWallet(address=address)],
                ),
            ],
        )
        session.commit()

        assert len(session.scalars(select(TrackedWallet)).all()) == 2
