from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.base import ApiModel


class TrackedWalletCreate(ApiModel):
    address: str = Field(min_length=1, max_length=128)
    label: str | None = Field(default=None, max_length=120)


class TrackedWalletRead(ApiModel):
    id: UUID
    address_family: str
    address: str
    label: str | None
    sync_status: Literal["never", "success", "failed"]
    last_sync_attempt_at: datetime | None
    last_synced_at: datetime | None
    last_sync_error_code: str | None
    created_at: datetime
    updated_at: datetime


class WalletRefreshResult(ApiModel):
    wallet: TrackedWalletRead
    position_count: int = Field(ge=0)
