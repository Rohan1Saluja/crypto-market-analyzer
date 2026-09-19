from collections.abc import Iterator
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import (
    get_authenticated_identity,
    get_identity_provider,
    get_token_price_provider,
)
from app.db.base import Base
from app.db.session import get_db_session
from app.main import app
from app.models import TrackedWallet, User, WalletPosition
from app.security.auth0 import Auth0UserProfile, AuthenticatedIdentity

WALLET_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
WALLET_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
UNPRICED = "0x1111111111111111111111111111111111111111"


class StubIdentityProvider:
    def get_user_profile(self, access_token: str) -> Auth0UserProfile:
        return Auth0UserProfile(
            subject="auth0|alice",
            email="alice@example.com",
            email_verified=True,
            name="Alice",
        )


class StubTokenPriceProvider:
    def get_native_price_usd(self, *, network_id: str) -> Decimal | None:
        assert network_id == "eip155:1"
        return Decimal("2000")

    def get_token_prices_usd(
        self,
        *,
        network_id: str,
        asset_references: list[str],
    ) -> dict[str, Decimal]:
        assert network_id == "eip155:1"
        assert set(asset_references) == {USDC, UNPRICED}
        return {USDC: Decimal("1")}

    def close(self) -> None:
        pass


@pytest.fixture
def exposure_context() -> Iterator[tuple[TestClient, sessionmaker[Session]]]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(
        bind=engine,
        class_=Session,
        expire_on_commit=False,
    )

    synced_at = datetime(2026, 9, 19, 15, 30, tzinfo=UTC)

    with testing_session() as session:
        alice = User(
            email="alice@example.com",
            auth_subject="auth0|alice",
        )
        wallet_a = TrackedWallet(
            address=WALLET_A,
            label="Primary",
            sync_status="success",
            last_synced_at=synced_at,
        )
        wallet_b = TrackedWallet(
            address=WALLET_B,
            label="Secondary",
            sync_status="success",
            last_synced_at=synced_at,
        )
        wallet_a.positions.extend(
            [
                WalletPosition(
                    network_id="eip155:1",
                    asset_kind="native",
                    asset_reference="native",
                    name="Ethereum",
                    symbol="ETH",
                    decimals=18,
                    raw_balance=Decimal("1000000000000000000"),
                    observed_at=synced_at,
                ),
                WalletPosition(
                    network_id="eip155:1",
                    asset_kind="erc20",
                    asset_reference=USDC,
                    name="USD Coin",
                    symbol="USDC",
                    decimals=6,
                    raw_balance=Decimal("2500000"),
                    observed_at=synced_at,
                ),
            ],
        )
        wallet_b.positions.extend(
            [
                WalletPosition(
                    network_id="eip155:1",
                    asset_kind="native",
                    asset_reference="native",
                    name="Ethereum",
                    symbol="ETH",
                    decimals=18,
                    raw_balance=Decimal("2000000000000000000"),
                    observed_at=synced_at,
                ),
                WalletPosition(
                    network_id="eip155:1",
                    asset_kind="erc20",
                    asset_reference=UNPRICED,
                    name="Unknown Token",
                    symbol="UNKNOWN",
                    decimals=18,
                    raw_balance=Decimal("10000000000000000000"),
                    observed_at=synced_at,
                ),
            ],
        )
        alice.tracked_wallets.extend([wallet_a, wallet_b])

        bob = User(
            email="bob@example.com",
            auth_subject="auth0|bob",
        )
        bob.tracked_wallets.append(
            TrackedWallet(
                address="0xcccccccccccccccccccccccccccccccccccccccc",
                sync_status="success",
                last_synced_at=synced_at,
                positions=[
                    WalletPosition(
                        network_id="eip155:1",
                        asset_kind="native",
                        asset_reference="native",
                        name="Ethereum",
                        symbol="ETH",
                        decimals=18,
                        raw_balance=Decimal("99000000000000000000"),
                        observed_at=synced_at,
                    ),
                ],
            ),
        )

        session.add_all([alice, bob])
        session.commit()

    def override_db() -> Iterator[Session]:
        with testing_session() as session:
            yield session

    def override_identity() -> AuthenticatedIdentity:
        return AuthenticatedIdentity(
            subject="auth0|alice",
            access_token="alice-token",
        )

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_authenticated_identity] = override_identity
    app.dependency_overrides[get_identity_provider] = lambda: StubIdentityProvider()
    app.dependency_overrides[get_token_price_provider] = lambda: StubTokenPriceProvider()

    with TestClient(app) as client:
        yield client, testing_session

    app.dependency_overrides.clear()
    engine.dispose()


def test_exposure_aggregates_asset_identity_and_keeps_unpriced_assets(
    exposure_context,
) -> None:
    client, _ = exposure_context

    response = client.get("/api/v1/me/exposure")

    assert response.status_code == 200
    payload = response.json()

    assert payload["summary"]["trackedValueUsd"] == 6002.5
    assert payload["summary"]["pricedPositionCount"] == 2
    assert payload["summary"]["unpricedPositionCount"] == 1
    assert len(payload["wallets"]) == 2
    assert len(payload["positions"]) == 3

    eth = next(
        position
        for position in payload["positions"]
        if position["assetReference"] == "native"
    )
    usdc = next(
        position
        for position in payload["positions"]
        if position["assetReference"] == USDC
    )
    unknown = next(
        position
        for position in payload["positions"]
        if position["assetReference"] == UNPRICED
    )

    assert eth["quantity"] == "3"
    assert eth["priceUsd"] == 2000.0
    assert eth["valueUsd"] == 6000.0
    assert eth["weight"] == pytest.approx((6000 / 6002.5) * 100)

    assert usdc["quantity"] == "2.5"
    assert usdc["valueUsd"] == 2.5

    assert unknown["quantity"] == "10"
    assert unknown["priceAvailable"] is False
    assert unknown["priceUsd"] is None
    assert unknown["valueUsd"] is None
    assert unknown["weight"] is None
