from fastapi import APIRouter

from app.api.routes import coins, markets, me
from app.core.config import get_settings

settings = get_settings()

api_router = APIRouter(prefix=settings.api_v1_prefix)
api_router.include_router(markets.router)
api_router.include_router(coins.router)
api_router.include_router(me.router)
