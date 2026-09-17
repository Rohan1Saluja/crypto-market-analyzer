from app.schemas.base import ApiModel


class MarketCoin(ApiModel):
    id: str
    name: str
    symbol: str
    rank: int
    price: float
    change_1h: float
    change_24h: float
    change_7d: float
    market_cap: float
    volume_24h: float
    sparkline: list[float]


class MarketStat(ApiModel):
    label: str
    value: str
    helper: str
    change: float | None = None
