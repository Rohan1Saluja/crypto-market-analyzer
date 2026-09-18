from typing import Literal

from pydantic import Field

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


class CoinFundamentals(ApiModel):
    circulating_supply: float | None = None
    total_supply: float | None = None
    max_supply: float | None = None
    fully_diluted_valuation: float | None = None
    all_time_high: float | None = None
    all_time_high_change_percentage: float | None = None
    all_time_high_date: str | None = None
    all_time_low: float | None = None
    all_time_low_change_percentage: float | None = None
    all_time_low_date: str | None = None
    genesis_date: str | None = None
    hashing_algorithm: str | None = None
    categories: list[str] = Field(default_factory=list)
    homepage_url: str | None = None
    blockchain_explorer_url: str | None = None


class CoinSentiment(ApiModel):
    votes_up_percentage: float | None = None
    votes_down_percentage: float | None = None
    watchlist_users: int | None = None
    reddit_subscribers: int | None = None
    github_stars: int | None = None
    github_forks: int | None = None
    github_commits_4_weeks: int | None = None


class CoinResearch(ApiModel):
    fundamentals: CoinFundamentals = Field(default_factory=CoinFundamentals)
    sentiment: CoinSentiment = Field(default_factory=CoinSentiment)


class CoinNewsItem(ApiModel):
    title: str
    source: str
    url: str
    published_at: str | None = None


class CoinDetail(ApiModel):
    coin: MarketCoin
    description: str | None
    metrics: list[CoinMetric]
