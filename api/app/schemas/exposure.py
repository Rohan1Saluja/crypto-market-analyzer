from datetime import datetime
from typing import Literal
from uuid import UUID

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


class ExposureSummary(ApiModel):
    tracked_value_usd: float
    priced_position_count: int = Field(ge=0)
    unpriced_position_count: int = Field(ge=0)
    largest_position_weight: float | None = None
    last_synced_at: datetime | None = None


class ExposureWallet(ApiModel):
    id: UUID
    address: str
    label: str | None
    network_ids: list[str]
    sync_status: Literal["never", "success", "failed"]
    last_sync_attempt_at: datetime | None
    last_synced_at: datetime | None
    last_sync_error_code: str | None


class ExposurePosition(ApiModel):
    network_id: str
    asset_kind: Literal["native", "erc20"]
    asset_reference: str
    name: str | None
    symbol: str | None
    decimals: int | None
    quantity: str | None
    price_usd: float | None
    value_usd: float | None
    weight: float | None
    price_available: bool


class ExposureReadModel(ApiModel):
    summary: ExposureSummary
    wallets: list[ExposureWallet]
    positions: list[ExposurePosition]
