from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.cache import TtlCache
from app.core.exceptions import MarketDataProviderError, MarketDataRateLimitError
from app.schemas.coin import CoinFundamentals, CoinResearch, CoinSentiment


class CoinGeckoResearchProvider:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        cache_ttl_seconds: int,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._cache_ttl_seconds = cache_ttl_seconds
        self._cache = TtlCache()
        self._client = httpx.Client(
            base_url=base_url.rstrip("/") + "/",
            headers={
                "accept": "application/json",
                "x-cg-demo-api-key": api_key,
            },
            timeout=httpx.Timeout(10.0),
            transport=transport,
        )

    def close(self) -> None:
        self._client.close()

    def get_coin_research(self, coin_id: str) -> CoinResearch | None:
        params = {
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "true",
            "developer_data": "true",
            "sparkline": "false",
        }
        payload = self._get_json(
            f"coins/{coin_id}",
            params=params,
            allow_not_found=True,
        )

        if payload is None:
            return None

        data = self._require_dict(payload)
        market_data = self._optional_dict(data.get("market_data"))
        community_data = self._optional_dict(data.get("community_data"))
        developer_data = self._optional_dict(data.get("developer_data"))
        links = self._optional_dict(data.get("links"))

        fundamentals = CoinFundamentals(
            circulating_supply=self._number(market_data.get("circulating_supply")),
            total_supply=self._number(market_data.get("total_supply")),
            max_supply=self._number(market_data.get("max_supply")),
            fully_diluted_valuation=self._nested_number(
                market_data,
                "fully_diluted_valuation",
                "usd",
            ),
            all_time_high=self._nested_number(market_data, "ath", "usd"),
            all_time_high_change_percentage=self._nested_number(
                market_data,
                "ath_change_percentage",
                "usd",
            ),
            all_time_high_date=self._nested_string(
                market_data,
                "ath_date",
                "usd",
            ),
            all_time_low=self._nested_number(market_data, "atl", "usd"),
            all_time_low_change_percentage=self._nested_number(
                market_data,
                "atl_change_percentage",
                "usd",
            ),
            all_time_low_date=self._nested_string(
                market_data,
                "atl_date",
                "usd",
            ),
            genesis_date=self._string(data.get("genesis_date")),
            hashing_algorithm=self._string(data.get("hashing_algorithm")),
            categories=self._string_list(data.get("categories"), limit=6),
            homepage_url=self._first_url(links.get("homepage")),
            blockchain_explorer_url=self._first_url(
                links.get("blockchain_site"),
            ),
        )
        sentiment = CoinSentiment(
            votes_up_percentage=self._number(
                data.get("sentiment_votes_up_percentage"),
            ),
            votes_down_percentage=self._number(
                data.get("sentiment_votes_down_percentage"),
            ),
            watchlist_users=self._integer(data.get("watchlist_portfolio_users")),
            reddit_subscribers=self._integer(
                community_data.get("reddit_subscribers"),
            ),
            github_stars=self._integer(developer_data.get("stars")),
            github_forks=self._integer(developer_data.get("forks")),
            github_commits_4_weeks=self._integer(
                developer_data.get("commit_count_4_weeks"),
            ),
        )

        return CoinResearch(
            fundamentals=fundamentals,
            sentiment=sentiment,
        )

    def _get_json(
        self,
        path: str,
        *,
        params: dict[str, str],
        allow_not_found: bool = False,
    ) -> Any:
        key = f"research:{path}?{urlencode(sorted(params.items()))}"

        def loader() -> Any:
            try:
                response = self._client.get(path, params=params)
            except httpx.TimeoutException as error:
                raise MarketDataProviderError("CoinGecko request timed out.") from error
            except httpx.HTTPError as error:
                raise MarketDataProviderError("CoinGecko request failed.") from error

            if response.status_code == 404 and allow_not_found:
                return None

            if response.status_code == 429:
                raise MarketDataRateLimitError("CoinGecko rate limit reached.")

            if response.is_error:
                raise MarketDataProviderError(
                    f"CoinGecko returned HTTP {response.status_code}."
                )

            try:
                return response.json()
            except ValueError as error:
                raise MarketDataProviderError(
                    "CoinGecko returned invalid JSON."
                ) from error

        return self._cache.get_or_load(
            key,
            ttl_seconds=self._cache_ttl_seconds,
            loader=loader,
        )

    @classmethod
    def _nested_number(
        cls,
        data: dict[str, Any],
        container_key: str,
        value_key: str,
    ) -> float | None:
        container = data.get(container_key)
        if not isinstance(container, dict):
            return None
        return cls._number(container.get(value_key))

    @classmethod
    def _nested_string(
        cls,
        data: dict[str, Any],
        container_key: str,
        value_key: str,
    ) -> str | None:
        container = data.get(container_key)
        if not isinstance(container, dict):
            return None
        return cls._string(container.get(value_key))

    @staticmethod
    def _optional_dict(value: object) -> dict[str, Any]:
        return value if isinstance(value, dict) else {}

    @staticmethod
    def _require_dict(value: object) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise MarketDataProviderError("CoinGecko returned an invalid research payload.")
        return value

    @staticmethod
    def _number(value: object) -> float | None:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return None
        return float(value)

    @staticmethod
    def _integer(value: object) -> int | None:
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            return None
        return int(value)

    @staticmethod
    def _string(value: object) -> str | None:
        if not isinstance(value, str):
            return None
        clean = value.strip()
        return clean or None

    @classmethod
    def _string_list(cls, value: object, *, limit: int) -> list[str]:
        if not isinstance(value, list):
            return []
        return [item for item in (cls._string(entry) for entry in value) if item][:limit]

    @classmethod
    def _first_url(cls, value: object) -> str | None:
        if not isinstance(value, list):
            return None

        for entry in value:
            candidate = cls._string(entry)
            if candidate and candidate.startswith(("https://", "http://")):
                return candidate

        return None
