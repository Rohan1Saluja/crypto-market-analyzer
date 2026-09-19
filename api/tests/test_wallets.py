from collections.abc import Iterator
from datetime import UTC, datetime
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import (
    get_authenticated_identity,
    get_identity_provider,
    get_wallet_portfolio_provider,
)
from app.core.exceptions import WalletPortfolioProviderError
from app.db.base import Base
from app.db.session import get_db_session
from app.main import app
from app.models import TrackedWallet, User, WalletPosition
from app.schemas.exposure import WalletHolding, WalletHoldingsSnapshot
from app.security.auth0 import Auth0UserProfile, AuthenticatedIdentity

WALLET = "0xabcdef0123456789abcdef0123456789abcdef01"
USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"


class StubIdentityProvider:
    def __init__(self, profiles: dict[str, Auth0UserProfile]) -> None:
        self.profiles = profiles

    def get_user_profile(self, access_token: str) -> Auth0UserProfile:
        return self.profiles[access_token]


class StubWalletPortfolioProvider:
    def __init__(self) -> None:
        self.fail = False

    def get_wallet_snapshot(
        self,
        *,
        address: str,
        network_id: str,
    ) -> WalletHoldingsSnapshot:
        if self.fail:
            raise WalletPortfolioProviderError("provider unavailable")

        return WalletHoldingsSnapshot(
            address=address,
            observed_at=datetime.now(UTC),
            positions=[
                WalletHolding(
                    network_id=network_id,
                    asset_kind="native",
                    asset_reference="native",
                    name="Ethereum",
                    symbol="ETH",
                    decimals=18,
                    raw_balance=1_000_000_000_000_000_000,
                ),
                WalletHolding(
                    network_id=network_id,
                    asset_kind="erc20",
                    asset_reference=USDC,
                    name="USD Coin",
                    symbol="USDC",
                    decimals=6,
                    raw_balance=2_500_000,
                ),
            ],
        )

    def close(self) -> None:
        pass


@pytest.fixture
def wallet_context() -> Iterator[
    tuple[
        TestClient,
        dict[str, str],
        sessionmaker[Session],
        StubWalletPortfolioProvider,
    ]
]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection, _) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    
    testing_session = sessionmaker(
        bind=engine,
        class_=Session,
        expire_on_commit=False,
    )
    identity = {"subject": "auth0|alice", "token": "alice-token"}
    identity_provider = StubIdentityProvider(
        {
            "alice-token": Auth0UserProfile(
                subject="auth0|alice",
                email="alice@example.com",
                email_verified=True,
                name="Alice",
            ),
            "bob-token": Auth0UserProfile(
                subject="auth0|bob",
                email="bob@example.com",
                email_verified=True,
                name="Bob",
            ),
        },
    )
    wallet_provider = StubWalletPortfolioProvider()

    def override_db() -> Iterator[Session]:
        with testing_session() as session:
            yield session

    def override_identity() -> AuthenticatedIdentity:
        return AuthenticatedIdentity(
            subject=identity["subject"],
            access_token=identity["token"],
        )

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_authenticated_identity] = override_identity
    app.dependency_overrides[get_identity_provider] = lambda: identity_provider
    app.dependency_overrides[get_wallet_portfolio_provider] = lambda: wallet_provider

    with TestClient(app) as client:
        yield client, identity, testing_session, wallet_provider

    app.dependency_overrides.clear()
    engine.dispose()


def test_create_and_list_wallet_normalizes_address(wallet_context) -> None:
    client, _, _, _ = wallet_context

    created = client.post(
        "/api/v1/me/wallets",
        json={
            "address": f"  {WALLET.upper().replace('0X', '0x')}  ",
            "label": "  Primary  ",
        },
    )
    listed = client.get("/api/v1/me/wallets")

    assert created.status_code == 201
    assert created.json()["address"] == WALLET
    assert created.json()["label"] == "Primary"
    assert created.json()["syncStatus"] == "never"
    assert [wallet["id"] for wallet in listed.json()] == [created.json()["id"]]


def test_duplicate_wallet_is_rejected_per_user(wallet_context) -> None:
    client, _, _, _ = wallet_context

    first = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET},
    )
    duplicate = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET.upper().replace("0X", "0x")},
    )

    assert first.status_code == 201
    assert duplicate.status_code == 409


def test_wallets_are_scoped_to_current_user(wallet_context) -> None:
    client, identity, _, _ = wallet_context

    created = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET},
    )
    wallet_id = UUID(created.json()["id"])

    identity.update(subject="auth0|bob", token="bob-token")

    listed = client.get("/api/v1/me/wallets")
    deleted = client.delete(f"/api/v1/me/wallets/{wallet_id}")
    refreshed = client.post(f"/api/v1/me/wallets/{wallet_id}/refresh")

    assert listed.status_code == 200
    assert listed.json() == []
    assert deleted.status_code == 404
    assert refreshed.status_code == 404


def test_refresh_persists_current_positions_atomically(wallet_context) -> None:
    client, _, testing_session, _ = wallet_context

    created = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET},
    )
    wallet_id = UUID(created.json()["id"])

    refreshed = client.post(f"/api/v1/me/wallets/{wallet_id}/refresh")

    assert refreshed.status_code == 200
    assert refreshed.json()["positionCount"] == 2
    assert refreshed.json()["wallet"]["syncStatus"] == "success"
    assert refreshed.json()["wallet"]["lastSyncedAt"] is not None

    with testing_session() as session:
        wallet = session.get(TrackedWallet, wallet_id)
        positions = list(
            session.scalars(
                select(WalletPosition)
                .where(WalletPosition.wallet_id == wallet_id)
                .order_by(WalletPosition.asset_reference.asc()),
            ),
        )

        assert wallet is not None
        assert wallet.last_sync_error_code is None
        assert len(positions) == 2
        assert {position.symbol for position in positions} == {"ETH", "USDC"}


def test_failed_refresh_preserves_last_good_positions(wallet_context) -> None:
    client, _, testing_session, wallet_provider = wallet_context

    created = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET},
    )
    wallet_id = UUID(created.json()["id"])

    first_refresh = client.post(f"/api/v1/me/wallets/{wallet_id}/refresh")
    assert first_refresh.status_code == 200

    wallet_provider.fail = True
    failed_refresh = client.post(f"/api/v1/me/wallets/{wallet_id}/refresh")

    assert failed_refresh.status_code == 502

    with testing_session() as session:
        wallet = session.get(TrackedWallet, wallet_id)
        positions = list(
            session.scalars(
                select(WalletPosition).where(
                    WalletPosition.wallet_id == wallet_id
                ),
            ),
        )

        assert wallet is not None
        assert wallet.sync_status == "failed"
        assert wallet.last_synced_at is not None
        assert wallet.last_sync_error_code == "WalletPortfolioProviderError"
        assert len(positions) == 2


def test_delete_wallet_cascades_positions(wallet_context) -> None:
    client, _, testing_session, _ = wallet_context

    created = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET},
    )
    wallet_id = UUID(created.json()["id"])
    client.post(f"/api/v1/me/wallets/{wallet_id}/refresh")

    deleted = client.delete(f"/api/v1/me/wallets/{wallet_id}")

    assert deleted.status_code == 204

    with testing_session() as session:
        assert session.get(TrackedWallet, wallet_id) is None
        assert (
            session.scalar(
                select(WalletPosition).where(
                    WalletPosition.wallet_id == wallet_id
                ),
            )
            is None
        )


def test_wallet_is_private_state_but_same_address_can_exist_for_two_users(
    wallet_context,
) -> None:
    client, identity, testing_session, _ = wallet_context

    alice = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET},
    )
    assert alice.status_code == 201

    identity.update(subject="auth0|bob", token="bob-token")
    bob = client.post(
        "/api/v1/me/wallets",
        json={"address": WALLET},
    )

    assert bob.status_code == 201

    with testing_session() as session:
        users = list(session.scalars(select(User).order_by(User.email.asc())))
        wallets = list(session.scalars(select(TrackedWallet)))

        assert len(users) == 2
        assert len(wallets) == 2
