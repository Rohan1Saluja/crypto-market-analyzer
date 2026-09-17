from app.schemas.base import ApiModel


class MarketCoin(ApiModel):
    id: str
    name: str
    symbol: str
    image_url: str | None = None
    rank: int | None
    price: float | None
    change_1h: float | None
    change_24h: float | None
    change_7d: float | None
    market_cap: float | None
    volume_24h: float | None
    sparkline: list[float]


class GlobalMarketSnapshot(ApiModel):
    total_market_cap_usd: float | None
    total_volume_usd: float | None
    btc_dominance: float | None
    active_cryptocurrencies: int | None
    market_cap_change_percentage_24h_usd: float | None
    volume_change_percentage_24h_usd: float | None


class MarketStat(ApiModel):
    label: str
    value: str
    helper: str
    change: float | None = None
