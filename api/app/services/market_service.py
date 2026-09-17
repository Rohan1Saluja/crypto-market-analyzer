from app.providers.base import HistoryRange, MarketProvider
from app.schemas.coin import CoinDetail, CoinMetric, PricePoint, TechnicalSnapshot
from app.schemas.market import MarketCoin, MarketStat
from app.services.technical_service import TechnicalService


class MarketService:
    def __init__(
        self,
        *,
        provider: MarketProvider,
        technical_service: TechnicalService,
    ) -> None:
        self._provider = provider
        self._technical_service = technical_service

    def get_market_overview(self) -> list[MarketStat]:
        snapshot = self._provider.get_global_market()

        return [
            MarketStat(
                label="Global market cap",
                value=self._format_optional_currency(
                    snapshot.total_market_cap_usd,
                ),
                helper="Across active crypto assets",
                change=snapshot.market_cap_change_percentage_24h_usd,
            ),
            MarketStat(
                label="24h volume",
                value=self._format_optional_currency(
                    snapshot.total_volume_usd,
                ),
                helper="Reported global trading volume",
                change=snapshot.volume_change_percentage_24h_usd,
            ),
            MarketStat(
                label="BTC dominance",
                value=self._format_optional_percentage(
                    snapshot.btc_dominance,
                ),
                helper="Bitcoin share of total market cap",
            ),
            MarketStat(
                label="Active cryptocurrencies",
                value=self._format_optional_integer(
                    snapshot.active_cryptocurrencies,
                ),
                helper="Active assets reported by CoinGecko",
            ),
        ]

    def get_markets(self) -> list[MarketCoin]:
        return self._provider.list_markets(limit=100)

    def get_coin_detail(self, coin_id: str) -> CoinDetail | None:
        profile = self._provider.get_coin_profile(coin_id)

        if profile is None:
            return None

        coin = profile.coin

        return CoinDetail(
            coin=coin,
            description=profile.description,
            metrics=[
                CoinMetric(
                    label="Market rank",
                    value=(
                        f"#{coin.rank}"
                        if coin.rank is not None
                        else "Unavailable"
                    ),
                    helper="By market capitalization",
                ),
                CoinMetric(
                    label="Market cap",
                    value=self._format_optional_currency(
                        coin.market_cap,
                    ),
                    helper="Current network valuation",
                ),
                CoinMetric(
                    label="24h volume",
                    value=self._format_optional_currency(
                        coin.volume_24h,
                    ),
                    helper="Reported trading activity",
                ),
                CoinMetric(
                    label="7d performance",
                    value=self._format_optional_change(
                        coin.change_7d,
                    ),
                    helper="Seven-day price change",
                ),
            ],
        )

    def get_coin_price_history(
        self,
        coin_id: str,
        *,
        time_range: HistoryRange,
    ) -> list[PricePoint] | None:
        return self._provider.get_price_history(
            coin_id,
            time_range=time_range,
        )

    def get_coin_technicals(
        self,
        coin_id: str,
    ) -> TechnicalSnapshot | None:
        history = self._provider.get_price_history(
            coin_id,
            time_range="30d",
        )

        if history is None:
            return None

        return self._technical_service.calculate(history)

    @staticmethod
    def _format_optional_currency(
        value: float | None,
    ) -> str:
        if value is None:
            return "Unavailable"

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
    def _format_optional_change(
        value: float | None,
    ) -> str:
        if value is None:
            return "Unavailable"

        prefix = "+" if value >= 0 else ""
        return f"{prefix}{value:.2f}%"

    @staticmethod
    def _format_optional_percentage(
        value: float | None,
    ) -> str:
        if value is None:
            return "Unavailable"

        return f"{value:.1f}%"

    @staticmethod
    def _format_optional_integer(
        value: int | None,
    ) -> str:
        if value is None:
            return "Unavailable"

        return f"{value:,}"
