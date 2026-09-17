from app.data.market_seed import MARKET_COINS, MARKET_STATS
from app.schemas.market import MarketCoin, MarketStat


class SeedMarketProvider:
    def __init__(self) -> None:
        self._coins = [
            MarketCoin.model_validate(item)
            for item in MARKET_COINS
        ]
        self._stats = [
            MarketStat.model_validate(item)
            for item in MARKET_STATS
        ]

    def list_market_stats(self) -> list[MarketStat]:
        return self._stats.copy()

    def list_markets(self) -> list[MarketCoin]:
        return self._coins.copy()

    def get_coin(self, coin_id: str) -> MarketCoin | None:
        return next(
            (coin for coin in self._coins if coin.id == coin_id),
            None,
        )
