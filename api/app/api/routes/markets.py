from fastapi import APIRouter

from app.api.dependencies import MarketServiceDep
from app.schemas.market import MarketCoin, MarketStat

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("/overview", response_model=list[MarketStat])
def get_market_overview(service: MarketServiceDep) -> list[MarketStat]:
    return service.get_market_overview()


@router.get("", response_model=list[MarketCoin])
def get_markets(service: MarketServiceDep) -> list[MarketCoin]:
    return service.get_markets()
