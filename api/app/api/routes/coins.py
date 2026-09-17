from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.api.dependencies import MarketServiceDep
from app.schemas.coin import CoinDetail, PricePoint, TechnicalSnapshot

router = APIRouter(prefix="/coins", tags=["coins"])


@router.get("/{coin_id}", response_model=CoinDetail)
def get_coin(
    coin_id: str,
    service: MarketServiceDep,
) -> CoinDetail:
    detail = service.get_coin_detail(coin_id)

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown coin: {coin_id}",
        )

    return detail


@router.get("/{coin_id}/price-history", response_model=list[PricePoint])
def get_coin_price_history(
    coin_id: str,
    service: MarketServiceDep,
    time_range: Annotated[
        Literal["24h", "7d", "30d"],
        Query(alias="range"),
    ] = "7d",
) -> list[PricePoint]:
    history = service.get_coin_price_history(
        coin_id,
        time_range=time_range,
    )

    if history is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown coin: {coin_id}",
        )

    return history


@router.get("/{coin_id}/technicals", response_model=TechnicalSnapshot)
def get_coin_technicals(
    coin_id: str,
    service: MarketServiceDep,
) -> TechnicalSnapshot:
    technicals = service.get_coin_technicals(coin_id)

    if technicals is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown coin: {coin_id}",
        )

    return technicals
