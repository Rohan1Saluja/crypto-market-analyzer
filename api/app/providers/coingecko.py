import re
from html import unescape
from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.cache import TtlCache
from app.core.exceptions import MarketDataProviderError, MarketDataRateLimitError
from app.providers.base import HistoryRange
from app.schemas.coin import CoinProfile, OhlcPoint, PricePoint
from app.schemas.market import GlobalMarketSnapshot, MarketCoin

_HTML_TAG_RE = re.compile(r"<[^>]+>")


class CoinGeckoMarketProvider:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        market_cache_ttl_seconds: int,
        history_cache_ttl_seconds: int,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._market_cache_ttl_seconds = market_cache_ttl_seconds
        self._history_cache_ttl_seconds = history_cache_ttl_seconds
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

    def get_global_market(self) -> GlobalMarketSnapshot:
        payload = self._get_json(
            "global",
            ttl_seconds=self._market_cache_ttl_seconds,
        )
        data = self._require_dict(payload).get("data")
        data = self._require_dict(data)

        return GlobalMarketSnapshot(
            total_market_cap_usd=self._nested_number(
                data,
                "total_market_cap",
                "usd",
            ),
            total_volume_usd=self._nested_number(
                data,
                "total_volume",
                "usd",
            ),
            btc_dominance=self._nested_number(
                data,
                "market_cap_percentage",
                "btc",
            ),
            active_cryptocurrencies=self._integer(
                data.get("active_cryptocurrencies"),
            ),
            market_cap_change_percentage_24h_usd=self._number(
                data.get("market_cap_change_percentage_24h_usd"),
            ),
            volume_change_percentage_24h_usd=self._number(
                data.get("volume_change_percentage_24h_usd"),
            ),
        )

    def list_markets(self, *, limit: int = 100) -> list[MarketCoin]:
        payload = self._get_json(
            "coins/markets",
            params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": min(max(limit, 1), 250),
                "page": 1,
                "sparkline": "true",
                "price_change_percentage": "1h,24h,7d",
                "locale": "en",
            },
            ttl_seconds=self._market_cache_ttl_seconds,
        )

        if not isinstance(payload, list):
            raise MarketDataProviderError("CoinGecko returned an invalid markets payload.")

        coins: list[MarketCoin] = []

        for item in payload:
            if not isinstance(item, dict):
                continue

            coin = self._market_coin_from_markets_payload(item)

            if coin is not None:
                coins.append(coin)

        return coins

    def get_coin_profile(self, coin_id: str) -> CoinProfile | None:
        payload = self._get_json(
            f"coins/{coin_id}",
            params={
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "false",
                "developer_data": "false",
                "sparkline": "true",
            },
            ttl_seconds=self._market_cache_ttl_seconds,
            allow_not_found=True,
        )

        if payload is None:
            return None

        data = self._require_dict(payload)
        coin = self._market_coin_from_coin_payload(data)

        if coin is None:
            raise MarketDataProviderError("CoinGecko returned incomplete coin metadata.")

        description_payload = data.get("description")
        description = None

        if isinstance(description_payload, dict):
            description = self._clean_description(description_payload.get("en"))

        return CoinProfile(
            coin=coin,
            description=description,
        )

    def get_price_history(
        self,
        coin_id: str,
        *,
        time_range: HistoryRange,
    ) -> list[PricePoint] | None:
        day_map: dict[HistoryRange, int] = {
            "24h": 1,
            "7d": 7,
            "30d": 30,
        }

        payload = self._get_json(
            f"coins/{coin_id}/market_chart",
            params={
                "vs_currency": "usd",
                "days": day_map[time_range],
                "interval": "hourly",
                "precision": "full",
            },
            ttl_seconds=self._history_cache_ttl_seconds,
            allow_not_found=True,
        )

        if payload is None:
            return None

        data = self._require_dict(payload)
        prices = data.get("prices")

        if not isinstance(prices, list):
            raise MarketDataProviderError("CoinGecko returned invalid price history.")

        market_caps = self._series_by_timestamp(data.get("market_caps"))
        volumes = self._series_by_timestamp(data.get("total_volumes"))
        history: list[PricePoint] = []

        for row in prices:
            if not isinstance(row, list) or len(row) < 2:
                continue

            timestamp = self._integer(row[0])
            price = self._number(row[1])

            if timestamp is None or price is None:
                continue

            history.append(
                PricePoint(
                    timestamp=timestamp,
                    price=price,
                    market_cap=market_caps.get(timestamp),
                    volume_24h=volumes.get(timestamp),
                )
            )

        return history

    def get_ohlc_history(
        self,
        coin_id: str,
        *,
        time_range: HistoryRange,
    ) -> list[OhlcPoint] | None:
        day_map: dict[HistoryRange, int] = {
            "24h": 1,
            "7d": 7,
            "30d": 30,
        }

        payload = self._get_json(
            f"coins/{coin_id}/ohlc",
            params={
                "vs_currency": "usd",
                "days": day_map[time_range],
                "precision": "full",
            },
            ttl_seconds=self._history_cache_ttl_seconds,
            allow_not_found=True,
        )

        if payload is None:
            return None

        if not isinstance(payload, list):
            raise MarketDataProviderError("CoinGecko returned invalid OHLC history.")

        history: list[OhlcPoint] = []

        for row in payload:
            if not isinstance(row, list) or len(row) < 5:
                continue

            timestamp = self._integer(row[0])
            open_price = self._number(row[1])
            high = self._number(row[2])
            low = self._number(row[3])
            close = self._number(row[4])

            if (
                timestamp is None
                or open_price is None
                or high is None
                or low is None
                or close is None
            ):
                continue

            history.append(
                OhlcPoint(
                    timestamp=timestamp,
                    open=open_price,
                    high=high,
                    low=low,
                    close=close,
                )
            )

        return history

    def _get_json(
        self,
        path: str,
        *,
        params: dict[str, str | int] | None = None,
        ttl_seconds: int,
        allow_not_found: bool = False,
    ) -> Any:
        params = params or {}
        key = f"{path}?{urlencode(sorted(params.items()))}"

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
            ttl_seconds=ttl_seconds,
            loader=loader,
        )

    def _market_coin_from_markets_payload(
        self,
        data: dict[str, Any],
    ) -> MarketCoin | None:
        coin_id = data.get("id")
        name = data.get("name")
        symbol = data.get("symbol")

        if not all(isinstance(value, str) and value for value in (coin_id, name, symbol)):
            return None

        sparkline_payload = data.get("sparkline_in_7d")
        sparkline = []

        if isinstance(sparkline_payload, dict):
            sparkline = self._downsample_prices(
                sparkline_payload.get("price"),
            )

        return MarketCoin(
            id=coin_id,
            name=name,
            symbol=symbol.upper(),
            image_url=data.get("image") if isinstance(data.get("image"), str) else None,
            rank=self._integer(data.get("market_cap_rank")),
            price=self._number(data.get("current_price")),
            change_1h=self._number(
                data.get("price_change_percentage_1h_in_currency"),
            ),
            change_24h=self._number(
                data.get("price_change_percentage_24h_in_currency")
                or data.get("price_change_percentage_24h"),
            ),
            change_7d=self._number(
                data.get("price_change_percentage_7d_in_currency"),
            ),
            market_cap=self._number(data.get("market_cap")),
            volume_24h=self._number(data.get("total_volume")),
            sparkline=sparkline,
        )

    def _market_coin_from_coin_payload(
        self,
        data: dict[str, Any],
    ) -> MarketCoin | None:
        coin_id = data.get("id")
        name = data.get("name")
        symbol = data.get("symbol")
        market_data = data.get("market_data")

        if (
            not all(isinstance(value, str) and value for value in (coin_id, name, symbol))
            or not isinstance(market_data, dict)
        ):
            return None

        image_payload = data.get("image")
        image_url = None

        if isinstance(image_payload, dict):
            for size in ("large", "small", "thumb"):
                candidate = image_payload.get(size)
                if isinstance(candidate, str) and candidate:
                    image_url = candidate
                    break

        sparkline_payload = market_data.get("sparkline_7d")
        sparkline = []

        if isinstance(sparkline_payload, dict):
            sparkline = self._downsample_prices(
                sparkline_payload.get("price"),
            )

        return MarketCoin(
            id=coin_id,
            name=name,
            symbol=symbol.upper(),
            image_url=image_url,
            rank=self._integer(data.get("market_cap_rank")),
            price=self._nested_number(market_data, "current_price", "usd"),
            change_1h=self._nested_number(
                market_data,
                "price_change_percentage_1h_in_currency",
                "usd",
            ),
            change_24h=self._nested_number(
                market_data,
                "price_change_percentage_24h_in_currency",
                "usd",
            )
            or self._number(market_data.get("price_change_percentage_24h")),
            change_7d=self._nested_number(
                market_data,
                "price_change_percentage_7d_in_currency",
                "usd",
            ),
            market_cap=self._nested_number(market_data, "market_cap", "usd"),
            volume_24h=self._nested_number(market_data, "total_volume", "usd"),
            sparkline=sparkline,
        )

    @staticmethod
    def _clean_description(value: object) -> str | None:
        if not isinstance(value, str) or not value.strip():
            return None

        clean = _HTML_TAG_RE.sub(" ", unescape(value))
        clean = " ".join(clean.split())
        return clean or None

    @staticmethod
    def _downsample_prices(
        value: object,
        *,
        target_points: int = 24,
    ) -> list[float]:
        if not isinstance(value, list):
            return []

        prices = [
            float(item)
            for item in value
            if isinstance(item, (int, float)) and not isinstance(item, bool)
        ]

        if len(prices) <= target_points:
            return prices

        last_index = len(prices) - 1
        return [
            prices[round(index * last_index / (target_points - 1))]
            for index in range(target_points)
        ]

    @classmethod
    def _series_by_timestamp(
        cls,
        value: object,
    ) -> dict[int, float]:
        if not isinstance(value, list):
            return {}

        result: dict[int, float] = {}

        for row in value:
            if not isinstance(row, list) or len(row) < 2:
                continue

            timestamp = cls._integer(row[0])
            number = cls._number(row[1])

            if timestamp is not None and number is not None:
                result[timestamp] = number

        return result

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
    def _require_dict(value: object) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise MarketDataProviderError("CoinGecko returned an invalid response payload.")

        return value
