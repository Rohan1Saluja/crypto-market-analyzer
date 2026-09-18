from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_authenticated_identity, get_identity_provider
from app.db.base import Base
from app.db.session import get_db_session
from app.main import app
from app.models import User, WatchlistItem
from app.security.auth0 import Auth0UserProfile, AuthenticatedIdentity


class StubIdentityProvider:
    def __init__(self, profiles: dict[str, Auth0UserProfile]) -> None:
        self.profiles = profiles

    def get_user_profile(self, access_token: str) -> Auth0UserProfile:
        return self.profiles[access_token]


@pytest.fixture
def auth_context() -> Iterator[tuple[TestClient, dict[str, str], sessionmaker[Session]]]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)
    identity = {"subject": "auth0|alice", "token": "alice-token"}
    provider = StubIdentityProvider(
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
    app.dependency_overrides[get_identity_provider] = lambda: provider

    with TestClient(app) as client:
        yield client, identity, testing_session

    app.dependency_overrides.clear()
    engine.dispose()


def test_me_requires_authentication() -> None:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)

    def override_db() -> Iterator[Session]:
        with testing_session() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_db
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/me")
    finally:
        app.dependency_overrides.clear()
        engine.dispose()

    assert response.status_code == 401


def test_first_authenticated_request_materializes_user(auth_context) -> None:
    client, _, testing_session = auth_context

    response = client.get("/api/v1/me")

    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"
    assert response.json()["displayName"] == "Alice"

    with testing_session() as session:
        user = session.scalar(select(User).where(User.auth_subject == "auth0|alice"))
        assert user is not None
        assert user.email == "alice@example.com"


def test_existing_user_is_linked_without_losing_watchlist(auth_context) -> None:
    client, _, testing_session = auth_context
    with testing_session() as session:
        user = User(email="alice@example.com")
        user.watchlist_items.append(WatchlistItem(asset_id="bitcoin", thesis="Existing thesis"))
        session.add(user)
        session.commit()

    response = client.get("/api/v1/me")

    assert response.status_code == 200
    with testing_session() as session:
        user = session.scalar(select(User).where(User.email == "alice@example.com"))
        assert user is not None
        assert user.auth_subject == "auth0|alice"
        assert user.watchlist_items[0].asset_id == "bitcoin"
        assert user.watchlist_items[0].thesis == "Existing thesis"


def test_watchlist_is_scoped_to_current_user(auth_context) -> None:
    client, identity, _ = auth_context

    first = client.put("/api/v1/me/watchlist/bitcoin", json={"thesis": None})
    assert first.status_code == 200

    identity.update(subject="auth0|bob", token="bob-token")
    bob_list = client.get("/api/v1/me/watchlist")
    assert bob_list.status_code == 200
    assert bob_list.json() == []

    second = client.put("/api/v1/me/watchlist/ethereum", json={"thesis": "Watch staking"})
    assert second.status_code == 200

    identity.update(subject="auth0|alice", token="alice-token")
    alice_list = client.get("/api/v1/me/watchlist")
    assert alice_list.status_code == 200
    assert [item["assetId"] for item in alice_list.json()] == ["bitcoin"]


def test_watchlist_put_is_idempotent(auth_context) -> None:
    client, _, _ = auth_context

    client.put("/api/v1/me/watchlist/bitcoin", json={"thesis": None})
    updated = client.put(
        "/api/v1/me/watchlist/bitcoin",
        json={"thesis": "Updated thesis"},
    )
    listed = client.get("/api/v1/me/watchlist")

    assert updated.status_code == 200
    assert updated.json()["thesis"] == "Updated thesis"
    assert len(listed.json()) == 1
