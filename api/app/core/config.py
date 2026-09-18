from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

API_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Calyrn API"
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    database_url: str = "postgresql+psycopg://calyrn:calyrn@127.0.0.1:5432/calyrn"
    database_echo: bool = False

    coingecko_api_key: SecretStr
    coingecko_base_url: str = "https://api.coingecko.com/api/v3"
    market_cache_ttl_seconds: int = 60
    history_cache_ttl_seconds: int = 300
    research_cache_ttl_seconds: int = 300
    news_cache_ttl_seconds: int = 300

    model_config = SettingsConfigDict(
        env_file=API_ROOT / ".env",
        env_file_encoding="utf-8",
        env_prefix="CMA_",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
