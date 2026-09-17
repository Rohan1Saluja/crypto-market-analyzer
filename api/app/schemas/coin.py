from typing import Literal

from app.schemas.base import ApiModel
from app.schemas.market import MarketCoin


class PricePoint(ApiModel):
    timestamp: int
    price: float
    market_cap: float | None = None
    volume_24h: float | None = None


class CoinProfile(ApiModel):
    coin: MarketCoin
    description: str | None


class CoinMetric(ApiModel):
    label: str
    value: str
    helper: str


class TechnicalSnapshot(ApiModel):
    momentum: Literal["Bullish", "Neutral", "Bearish"]
    rsi: float
    macd: Literal["Bullish", "Bearish"]
    support: float
    resistance: float
    volatility: Literal["Low", "Moderate", "High"]
    volatility_annualized: float
    timeframe: Literal["1h"] = "1h"


class CoinDetail(ApiModel):
    coin: MarketCoin
    description: str | None
    metrics: list[CoinMetric]
