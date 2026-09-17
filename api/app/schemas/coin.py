from typing import Literal

from app.schemas.base import ApiModel
from app.schemas.market import MarketCoin


class CandlePoint(ApiModel):
    label: str
    price: float


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


class CoinDetail(ApiModel):
    coin: MarketCoin
    description: str
    metrics: list[CoinMetric]
    technicals: TechnicalSnapshot
