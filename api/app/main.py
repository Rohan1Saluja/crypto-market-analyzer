from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import SessionDep, close_market_provider
from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    MarketDataProviderError,
    MarketDataRateLimitError,
    TechnicalAnalysisUnavailableError,
)
from app.db.session import dispose_database_engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    close_market_provider()
    dispose_database_engine()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(MarketDataRateLimitError)
async def handle_provider_rate_limit(
    _: Request,
    __: MarketDataRateLimitError,
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Market data is temporarily rate limited. Try again shortly."},
        headers={"Retry-After": "60"},
    )


@app.exception_handler(MarketDataProviderError)
async def handle_provider_error(
    _: Request,
    __: MarketDataProviderError,
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content={"detail": "Market data provider is temporarily unavailable."},
    )


@app.exception_handler(TechnicalAnalysisUnavailableError)
async def handle_analysis_unavailable(
    _: Request,
    error: TechnicalAnalysisUnavailableError,
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": str(error)},
    )


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"], response_model=None)
def readiness_check(session: SessionDep) -> dict[str, str] | JSONResponse:
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database": "unavailable"},
        )

    return {"status": "ready", "database": "ok"}
