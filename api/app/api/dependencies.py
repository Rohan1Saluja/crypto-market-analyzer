from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db_session
from app.providers.coingecko import CoinGeckoMarketProvider
from app.providers.news import GoogleNewsProvider
from app.providers.research import CoinGeckoResearchProvider
from app.services.market_service import MarketService
from app.services.technical_service import TechnicalService

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

market_service = MarketService(
    provider=market_provider,
    technical_service=TechnicalService(),
    research_provider=research_provider,
    news_provider=news_provider,
)


def get_market_service() -> MarketService:
    return market_service


def close_market_provider() -> None:
    market_provider.close()
    research_provider.close()
    news_provider.close()


MarketServiceDep = Annotated[MarketService, Depends(get_market_service)]
SessionDep = Annotated[Session, Depends(get_db_session)]
