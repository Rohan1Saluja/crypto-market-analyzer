from math import log, sqrt
from statistics import stdev

from app.core.exceptions import TechnicalAnalysisUnavailableError
from app.schemas.coin import PricePoint, TechnicalSnapshot


class TechnicalService:
    def calculate(
        self,
        history: list[PricePoint],
    ) -> TechnicalSnapshot:
        prices = [
            point.price
            for point in history
            if point.price > 0
        ]

        if len(prices) < 35:
            raise TechnicalAnalysisUnavailableError(
                "Not enough hourly history is available to calculate technical indicators."
            )

        rsi = self._rsi(prices, period=14)
        macd_line, signal_line = self._macd(prices)
        macd = "Bullish" if macd_line >= signal_line else "Bearish"

        recent_prices = prices[-min(len(prices), 168):]
        support = min(recent_prices)
        resistance = max(recent_prices)

        hourly_returns = [
            log(current / previous)
            for previous, current in zip(
                recent_prices,
                recent_prices[1:],
                strict=False,
            )
            if previous > 0 and current > 0
        ]

        annualized_volatility = (
            stdev(hourly_returns) * sqrt(24 * 365) * 100
            if len(hourly_returns) >= 2
            else 0.0
        )

        if annualized_volatility < 50:
            volatility = "Low"
        elif annualized_volatility < 100:
            volatility = "Moderate"
        else:
            volatility = "High"

        if macd == "Bullish" and rsi >= 55:
            momentum = "Bullish"
        elif macd == "Bearish" and rsi <= 45:
            momentum = "Bearish"
        else:
            momentum = "Neutral"

        return TechnicalSnapshot(
            momentum=momentum,
            rsi=round(rsi, 2),
            macd=macd,
            support=support,
            resistance=resistance,
            volatility=volatility,
            volatility_annualized=round(annualized_volatility, 2),
        )

    @staticmethod
    def _rsi(
        prices: list[float],
        *,
        period: int,
    ) -> float:
        deltas = [
            current - previous
            for previous, current in zip(
                prices,
                prices[1:],
                strict=False,
            )
        ]
        gains = [max(delta, 0.0) for delta in deltas]
        losses = [max(-delta, 0.0) for delta in deltas]

        average_gain = sum(gains[:period]) / period
        average_loss = sum(losses[:period]) / period

        for gain, loss in zip(
            gains[period:],
            losses[period:],
            strict=False,
        ):
            average_gain = (
                (average_gain * (period - 1)) + gain
            ) / period
            average_loss = (
                (average_loss * (period - 1)) + loss
            ) / period

        if average_loss == 0:
            return 100.0

        relative_strength = average_gain / average_loss
        return 100 - (100 / (1 + relative_strength))

    @classmethod
    def _macd(
        cls,
        prices: list[float],
    ) -> tuple[float, float]:
        ema_12 = cls._ema_series(prices, period=12)
        ema_26 = cls._ema_series(prices, period=26)
        macd_series = [
            fast - slow
            for fast, slow in zip(
                ema_12,
                ema_26,
                strict=True,
            )
        ]
        signal_series = cls._ema_series(
            macd_series,
            period=9,
        )
        return macd_series[-1], signal_series[-1]

    @staticmethod
    def _ema_series(
        values: list[float],
        *,
        period: int,
    ) -> list[float]:
        multiplier = 2 / (period + 1)
        ema = values[0]
        result: list[float] = []

        for value in values:
            ema = ((value - ema) * multiplier) + ema
            result.append(ema)

        return result
