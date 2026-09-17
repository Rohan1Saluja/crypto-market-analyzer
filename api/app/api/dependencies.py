from typing import Annotated

from fastapi import Depends

from app.core.config import get_settings
from app.providers.coingecko import CoinGeckoMarketProvider
from app.services.market_service import MarketService
from app.services.technical_service import TechnicalService

settings = get_settings()

market_provider = CoinGeckoMarketProvider(
    api_key=settings.coingecko_api_key.get_secret_value(),
    base_url=settings.coingecko_base_url,
    market_cache_ttl_seconds=settings.market_cache_ttl_seconds,
    history_cache_ttl_seconds=settings.history_cache_ttl_seconds,
)

market_service = MarketService(
    provider=market_provider,
    technical_service=TechnicalService(),
)


def get_market_service() -> MarketService:
    return market_service


def close_market_provider() -> None:
    market_provider.close()


MarketServiceDep = Annotated[MarketService, Depends(get_market_service)]
