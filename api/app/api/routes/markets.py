from fastapi import APIRouter

from app.schemas.market import MarketCoin, MarketStat
from app.services.market_service import market_service

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("/overview", response_model=list[MarketStat])
def get_market_overview() -> list[MarketStat]:
    return market_service.get_market_overview()


@router.get("", response_model=list[MarketCoin])
def get_markets() -> list[MarketCoin]:
    return market_service.get_markets()
