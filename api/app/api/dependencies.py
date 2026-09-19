from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import (
    AuthenticationError,
    IdentityConflictError,
    IdentityProviderError,
    VerifiedEmailRequiredError,
)
from app.db.session import get_db_session
from app.models.user import User
from app.providers.alchemy import AlchemyWalletPortfolioProvider
from app.providers.base import WalletPortfolioProvider
from app.providers.coingecko import CoinGeckoMarketProvider
from app.providers.news import GoogleNewsProvider
from app.providers.research import CoinGeckoResearchProvider
from app.security.auth0 import Auth0IdentityProvider, Auth0TokenVerifier, AuthenticatedIdentity
from app.services.market_service import MarketService
from app.services.technical_service import TechnicalService
from app.services.user_service import UserService
from app.services.watchlist_service import WatchlistService

settings = get_settings()

market_provider = CoinGeckoMarketProvider(
    api_key=settings.coingecko_api_key.get_secret_value(),
    base_url=settings.coingecko_base_url,
    market_cache_ttl_seconds=settings.market_cache_ttl_seconds,
    history_cache_ttl_seconds=settings.history_cache_ttl_seconds,
)
research_provider = CoinGeckoResearchProvider(
    api_key=settings.coingecko_api_key.get_secret_value(),
    base_url=settings.coingecko_base_url,
    cache_ttl_seconds=settings.research_cache_ttl_seconds,
)
news_provider = GoogleNewsProvider(
    cache_ttl_seconds=settings.news_cache_ttl_seconds,
)
wallet_portfolio_provider = AlchemyWalletPortfolioProvider(
    api_key=settings.alchemy_api_key.get_secret_value(),
    base_url=settings.alchemy_base_url,
)

market_service = MarketService(
    provider=market_provider,
    technical_service=TechnicalService(),
    research_provider=research_provider,
    news_provider=news_provider,
)
user_service = UserService()
watchlist_service = WatchlistService()
auth0_token_verifier = Auth0TokenVerifier(
    issuer=settings.auth0_issuer,
    audience=settings.auth0_audience,
    client_id=settings.auth0_client_id,
)
auth0_identity_provider = Auth0IdentityProvider(issuer=settings.auth0_issuer)
bearer_scheme = HTTPBearer(auto_error=False)


def get_market_service() -> MarketService:
    return market_service


def get_user_service() -> UserService:
    return user_service


def get_watchlist_service() -> WatchlistService:
    return watchlist_service


def get_wallet_portfolio_provider() -> WalletPortfolioProvider:
    return wallet_portfolio_provider


def get_identity_provider() -> Auth0IdentityProvider:
    return auth0_identity_provider


def get_authenticated_identity(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> AuthenticatedIdentity:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return auth0_token_verifier.verify(credentials.credentials)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def close_providers() -> None:
    market_provider.close()
    research_provider.close()
    news_provider.close()
    wallet_portfolio_provider.close()


MarketServiceDep = Annotated[MarketService, Depends(get_market_service)]
SessionDep = Annotated[Session, Depends(get_db_session)]
AuthenticatedIdentityDep = Annotated[AuthenticatedIdentity, Depends(get_authenticated_identity)]
IdentityProviderDep = Annotated[Auth0IdentityProvider, Depends(get_identity_provider)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
WatchlistServiceDep = Annotated[WatchlistService, Depends(get_watchlist_service)]
WalletPortfolioProviderDep = Annotated[
    WalletPortfolioProvider,
    Depends(get_wallet_portfolio_provider),
]


def get_current_user(
    session: SessionDep,
    identity: AuthenticatedIdentityDep,
    identity_provider: IdentityProviderDep,
    service: UserServiceDep,
) -> User:
    try:
        return service.resolve_authenticated_user(
            session=session,
            identity=identity,
            identity_provider=identity_provider,
        )
    except VerifiedEmailRequiredError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except IdentityConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except IdentityProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication profile is temporarily unavailable",
        ) from exc


CurrentUserDep = Annotated[User, Depends(get_current_user)]
