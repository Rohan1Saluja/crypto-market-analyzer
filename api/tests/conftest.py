import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault(
    "CMA_COINGECKO_API_KEY",
    "test-only-key",
)
os.environ.setdefault("CMA_AUTH0_DOMAIN", "calyrn-test.us.auth0.com")
os.environ.setdefault("CMA_AUTH0_AUDIENCE", "https://api.calyrn.test")
os.environ.setdefault("CMA_AUTH0_CLIENT_ID", "calyrn-test-client")
os.environ.setdefault("CMA_ALCHEMY_API_KEY", "test-only-alchemy-key")

from app.api.dependencies import get_market_service  # noqa: E402
from app.main import app  # noqa: E402
from app.providers.base import HistoryRange  # noqa: E402
from app.schemas.coin import CoinProfile, OhlcPoint, PricePoint  # noqa: E402
from app.schemas.market import GlobalMarketSnapshot, MarketCoin  # noqa: E402
from app.services.market_service import MarketService  # noqa: E402
from app.services.technical_service import TechnicalService  # noqa: E402


class TestMarketProvider:
    def __init__(self) -> None:
        self.coin = MarketCoin(
            id="bitcoin",
            name="Bitcoin",
            symbol="BTC",
            image_url="https://example.test/bitcoin.png",
            rank=1,
            price=67_183.42,
            change_1h=0.12,
            change_24h=2.48,
            change_7d=5.16,
            market_cap=1_328_000_000_000,
            volume_24h=38_200_000_000,
            sparkline=[65_000, 66_000, 67_183.42],
        )

    def get_global_market(self) -> GlobalMarketSnapshot:
        return GlobalMarketSnapshot(
            total_market_cap_usd=2_420_000_000_000,
            total_volume_usd=91_800_000_000,
            btc_dominance=54.7,
            active_cryptocurrencies=13_428,
            market_cap_change_percentage_24h_usd=2.14,
            volume_change_percentage_24h_usd=8.62,
        )

    def list_markets(self, *, limit: int = 100) -> list[MarketCoin]:
        return [self.coin][:limit]

    def get_coin_profile(self, coin_id: str) -> CoinProfile | None:
        if coin_id != "bitcoin":
            return None

        return CoinProfile(
            coin=self.coin,
            description="Bitcoin test fixture.",
        )

    def get_price_history(
        self,
        coin_id: str,
        *,
        time_range: HistoryRange,
    ) -> list[PricePoint] | None:
        if coin_id != "bitcoin":
            return None

        count = {
            "24h": 24,
            "7d": 168,
            "30d": 720,
        }[time_range]

        return [
            PricePoint(
                timestamp=1_700_000_000_000 + (index * 3_600_000),
                price=60_000 + (index * 8) + ((index % 9) - 4) * 35,
                market_cap=1_200_000_000_000 + index * 1_000_000,
                volume_24h=30_000_000_000 + index * 100_000,
            )
            for index in range(count)
        ]

    def get_ohlc_history(
        self,
        coin_id: str,
        *,
        time_range: HistoryRange,
    ) -> list[OhlcPoint] | None:
        if coin_id != "bitcoin":
            return None

        count = {
            "24h": 48,
            "7d": 42,
            "30d": 180,
        }[time_range]

        return [
            OhlcPoint(
                timestamp=1_700_000_000_000 + (index * 14_400_000),
                open=60_000 + index * 10,
                high=60_120 + index * 10,
                low=59_920 + index * 10,
                close=60_060 + index * 10,
            )
            for index in range(count)
        ]

    def close(self) -> None:
        pass


@pytest.fixture
def client() -> TestClient:
    service = MarketService(
        provider=TestMarketProvider(),
        technical_service=TechnicalService(),
    )
    app.dependency_overrides[get_market_service] = lambda: service

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
