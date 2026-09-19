from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.base import ApiModel


class WalletHolding(ApiModel):
    network_id: str
    asset_kind: Literal["native", "erc20"]
    asset_reference: str
    name: str | None = None
    symbol: str | None = None
    decimals: int | None = Field(default=None, ge=0, le=255)
    raw_balance: int = Field(ge=0)


class WalletHoldingsSnapshot(ApiModel):
    address: str
    observed_at: datetime
    positions: list[WalletHolding]
