from uuid import UUID

from app.schemas.base import ApiModel


class CurrentUser(ApiModel):
    id: UUID
    email: str
    display_name: str | None
