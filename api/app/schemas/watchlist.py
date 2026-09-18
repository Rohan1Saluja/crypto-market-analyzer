from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.base import ApiModel


class WatchlistItemUpsert(ApiModel):
    thesis: str | None = Field(default=None, max_length=4000)


class WatchlistItemRead(ApiModel):
    id: UUID
    asset_id: str
    thesis: str | None
    created_at: datetime
    updated_at: datetime
