from typing import Literal

from app.data.market_seed import COIN_DESCRIPTIONS
from app.providers.base import MarketProvider
from app.providers.seed import SeedMarketProvider
from app.schemas.coin import CandlePoint, CoinDetail, CoinMetric, TechnicalSnapshot
from app.schemas.market import MarketCoin, MarketStat

TimeRange = Literal["24h", "7d", "30d"]


class MarketService:
    def __init__(self, provider: MarketProvider) -> None:
        self._provider = provider

    def get_market_overview(self) -> list[MarketStat]:
        return self._provider.list_market_stats()

    def get_markets(self) -> list[MarketCoin]:
        return self._provider.list_markets()

    def get_coin_detail(self, coin_id: str) -> CoinDetail | None:
        coin = self._provider.get_coin(coin_id)

        if coin is None:
            return None

        return CoinDetail(
            coin=coin,
            description=COIN_DESCRIPTIONS.get(
                coin.id,
                f"{coin.name} is a tracked asset in Crypto Market Analyzer.",
            ),
            metrics=[
                CoinMetric(
                    label="Market rank",
                    value=f"#{coin.rank}",
                    helper="By market capitalization",
                ),
                CoinMetric(
                    label="Market cap",
                    value=self._format_compact_currency(coin.market_cap),
                    helper="Current network valuation",
                ),
                CoinMetric(
                    label="24h volume",
                    value=self._format_compact_currency(coin.volume_24h),
                    helper="Trading activity",
                ),
                CoinMetric(
                    label="7d performance",
                    value=self._format_change(coin.change_7d),
                    helper="Seven-day price change",
                ),
            ],
            technicals=self._build_technicals(coin),
        )

    def get_coin_candles(
        self,
        coin_id: str,
        *,
        time_range: TimeRange,
    ) -> list[CandlePoint] | None:
        coin = self._provider.get_coin(coin_id)

        if coin is None:
            return None

        amplitude_multipliers: dict[TimeRange, float] = {
            "24h": 0.55,
            "7d": 1.0,
            "30d": 1.8,
        }
        labels: dict[TimeRange, list[str]] = {
            "24h": [
                "00",
                "02",
                "04",
                "06",
                "08",
                "10",
                "12",
                "14",
                "16",
                "18",
                "20",
                "Now",
            ],
            "7d": [
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Now",
            ],
            "30d": [
                "W1",
                "W1",
                "W1",
                "W2",
                "W2",
                "W2",
                "W3",
                "W3",
                "W3",
                "W4",
                "W4",
                "Now",
            ],
        }

        min_value = min(coin.sparkline)
        max_value = max(coin.sparkline)
        value_range = max_value - min_value or 1
        amplitude = max(
            0.01,
            min(
                0.08,
                abs(coin.change_7d) / 100 + 0.018,
            ),
        )
        amplitude *= amplitude_multipliers[time_range]

        generated = [
            coin.price
            * (
                1
                + (
                    ((value - min_value) / value_range) - 0.5
                )
                * amplitude
            )
            for value in coin.sparkline
        ]

        adjustment = coin.price - generated[-1]

        return [
            CandlePoint(
                label=labels[time_range][index],
                price=max(0, price + adjustment),
            )
            for index, price in enumerate(generated)
        ]

    def get_coin_technicals(
        self,
        coin_id: str,
    ) -> TechnicalSnapshot | None:
        coin = self._provider.get_coin(coin_id)

        if coin is None:
            return None

        return self._build_technicals(coin)

    @staticmethod
    def _build_technicals(
        coin: MarketCoin,
    ) -> TechnicalSnapshot:
        rsi = max(
            25,
            min(
                75,
                50 + coin.change_7d * 2.2,
            ),
        )
        absolute_move = (
            abs(coin.change_24h)
            + abs(coin.change_7d) / 3
        )

        if coin.change_7d > 3:
            momentum = "Bullish"
        elif coin.change_7d < -3:
            momentum = "Bearish"
        else:
            momentum = "Neutral"

        if absolute_move > 7:
            volatility = "High"
        elif absolute_move > 3:
            volatility = "Moderate"
        else:
            volatility = "Low"

        move_buffer = max(
            0.025,
            absolute_move / 100,
        )

        return TechnicalSnapshot(
            momentum=momentum,
            rsi=round(rsi, 1),
            macd=(
                "Bullish"
                if coin.change_24h >= 0
                else "Bearish"
            ),
            support=coin.price * (1 - move_buffer),
            resistance=coin.price * (1 + move_buffer),
            volatility=volatility,
        )

    @staticmethod
    def _format_compact_currency(
        value: float,
    ) -> str:
        units = [
            (1_000_000_000_000, "T"),
            (1_000_000_000, "B"),
            (1_000_000, "M"),
            (1_000, "K"),
        ]

        for threshold, suffix in units:
            if abs(value) >= threshold:
                return f"${value / threshold:.2f}{suffix}"

        return f"${value:,.2f}"

    @staticmethod
    def _format_change(value: float) -> str:
        prefix = "+" if value >= 0 else ""
        return f"{prefix}{value:.2f}%"


market_service = MarketService(
    provider=SeedMarketProvider(),
)
