import json
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.cache import TtlCache
from app.core.exceptions import MarketDataProviderError, MarketDataRateLimitError
from app.domain.wallet import (
    ETHEREUM_MAINNET_NETWORK_ID,
    InvalidWalletAddressError,
    normalize_evm_address,
)

_PLATFORM_IDS = {
    ETHEREUM_MAINNET_NETWORK_ID: "ethereum",
}
_NATIVE_COIN_IDS = {
    ETHEREUM_MAINNET_NETWORK_ID: "ethereum",
}
_MAX_CONTRACTS_PER_REQUEST = 500


class CoinGeckoTokenPriceProvider:
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

    def get_native_price_usd(
        self,
        *,
        network_id: str,
    ) -> Decimal | None:
        coin_id = _NATIVE_COIN_IDS.get(network_id)
        if coin_id is None:
            raise MarketDataProviderError(
                f"Unsupported pricing network: {network_id}"
            )

        payload = self._get_json(
            "simple/price",
            params={
                "ids": coin_id,
                "vs_currencies": "usd",
                "precision": "full",
            },
        )
        data = self._require_dict(payload)
        quote = data.get(coin_id)

        if quote is None:
            return None

        return self._usd_price(quote)

    def get_token_prices_usd(
        self,
        *,
        network_id: str,
        asset_references: list[str],
    ) -> dict[str, Decimal]:
        platform_id = _PLATFORM_IDS.get(network_id)
        if platform_id is None:
            raise MarketDataProviderError(
                f"Unsupported pricing network: {network_id}"
            )

        normalized = sorted(
            {
                self._normalize_contract(reference)
                for reference in asset_references
            },
        )
        if not normalized:
            return {}

        prices: dict[str, Decimal] = {}

        for start in range(0, len(normalized), _MAX_CONTRACTS_PER_REQUEST):
            chunk = normalized[start : start + _MAX_CONTRACTS_PER_REQUEST]
            payload = self._get_json(
                f"simple/token_price/{platform_id}",
                params={
                    "contract_addresses": ",".join(chunk),
                    "vs_currencies": "usd",
                    "precision": "full",
                },
            )
            data = self._require_dict(payload)

            for key, quote in data.items():
                if not isinstance(key, str):
                    continue

                try:
                    contract = normalize_evm_address(key)
                except InvalidWalletAddressError:
                    continue

                price = self._usd_price(quote)
                if price is not None:
                    prices[contract] = price

        return prices

    def _get_json(
        self,
        path: str,
        *,
        params: dict[str, str],
    ) -> Any:
        key = f"{path}?{urlencode(sorted(params.items()))}"

        def loader() -> Any:
            try:
                response = self._client.get(path, params=params)
            except httpx.TimeoutException as exc:
                raise MarketDataProviderError(
                    "CoinGecko price request timed out."
                ) from exc
            except httpx.HTTPError as exc:
                raise MarketDataProviderError(
                    "CoinGecko price request failed."
                ) from exc

            if response.status_code == 429:
                raise MarketDataRateLimitError(
                    "CoinGecko price rate limit reached."
                )

            if response.is_error:
                raise MarketDataProviderError(
                    f"CoinGecko returned HTTP {response.status_code}."
                )

            try:
                return json.loads(
                    response.text,
                    parse_float=Decimal,
                    parse_int=Decimal,
                )
            except (json.JSONDecodeError, InvalidOperation) as exc:
                raise MarketDataProviderError(
                    "CoinGecko returned invalid price JSON."
                ) from exc

        return self._cache.get_or_load(
            key,
            ttl_seconds=self._cache_ttl_seconds,
            loader=loader,
        )

    @classmethod
    def _usd_price(cls, value: object) -> Decimal | None:
        if not isinstance(value, dict):
            return None

        return cls._decimal(value.get("usd"))

    @staticmethod
    def _decimal(value: object) -> Decimal | None:
        if isinstance(value, bool) or value is None:
            return None
        if isinstance(value, Decimal):
            return value
        if isinstance(value, (int, float, str)):
            try:
                return Decimal(str(value))
            except InvalidOperation:
                return None
        return None

    @staticmethod
    def _normalize_contract(value: str) -> str:
        try:
            return normalize_evm_address(value)
        except InvalidWalletAddressError as exc:
            raise MarketDataProviderError(
                "Invalid token contract address in pricing request"
            ) from exc

    @staticmethod
    def _require_dict(value: object) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise MarketDataProviderError(
                "CoinGecko returned an invalid price payload."
            )

        return value
