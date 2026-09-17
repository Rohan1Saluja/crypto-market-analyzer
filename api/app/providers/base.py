from typing import Protocol

from app.schemas.market import MarketCoin, MarketStat


class MarketProvider(Protocol):
    def list_market_stats(self) -> list[MarketStat]:
        ...

    def list_markets(self) -> list[MarketCoin]:
        ...

    def get_coin(self, coin_id: str) -> MarketCoin | None:
        ...
