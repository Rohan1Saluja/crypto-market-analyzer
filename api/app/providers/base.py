from typing import Literal, Protocol

from app.schemas.coin import CoinProfile, PricePoint
from app.schemas.market import GlobalMarketSnapshot, MarketCoin

HistoryRange = Literal["24h", "7d", "30d"]


class MarketProvider(Protocol):
    def get_global_market(self) -> GlobalMarketSnapshot:
        ...

    def list_markets(self, *, limit: int = 100) -> list[MarketCoin]:
        ...

    def get_coin_profile(self, coin_id: str) -> CoinProfile | None:
        ...

    def get_price_history(
        self,
        coin_id: str,
        *,
        time_range: HistoryRange,
    ) -> list[PricePoint] | None:
        ...

    def close(self) -> None:
        ...
