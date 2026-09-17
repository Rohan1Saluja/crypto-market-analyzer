from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.coin import CandlePoint, CoinDetail, TechnicalSnapshot
from app.services.market_service import market_service

router = APIRouter(prefix="/coins", tags=["coins"])


@router.get("/{coin_id}", response_model=CoinDetail)
def get_coin(coin_id: str) -> CoinDetail:
    detail = market_service.get_coin_detail(coin_id)

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown coin: {coin_id}",
        )

    return detail


@router.get("/{coin_id}/candles", response_model=list[CandlePoint])
def get_coin_candles(
    coin_id: str,
    time_range: Annotated[
        Literal["24h", "7d", "30d"],
        Query(alias="range"),
    ] = "7d",
) -> list[CandlePoint]:
    candles = market_service.get_coin_candles(
        coin_id,
        time_range=time_range,
    )

    if candles is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown coin: {coin_id}",
        )

    return candles


@router.get("/{coin_id}/technicals", response_model=TechnicalSnapshot)
def get_coin_technicals(coin_id: str) -> TechnicalSnapshot:
    technicals = market_service.get_coin_technicals(coin_id)

    if technicals is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown coin: {coin_id}",
        )

    return technicals
