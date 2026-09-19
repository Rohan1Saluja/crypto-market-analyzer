from datetime import UTC, datetime
from typing import Any

import httpx

from app.core.exceptions import (
    WalletPortfolioProviderError,
    WalletPortfolioRateLimitError,
)
from app.domain.wallet import (
    ETHEREUM_MAINNET_NETWORK_ID,
    InvalidWalletAddressError,
    normalize_evm_address,
)
from app.schemas.exposure import WalletHolding, WalletHoldingsSnapshot

_ALCHEMY_NETWORKS = {
    ETHEREUM_MAINNET_NETWORK_ID: "eth-mainnet",
}
_MAX_PAGES = 100


class AlchemyWalletPortfolioProvider:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._api_key = api_key
        self._client = httpx.Client(
            base_url=base_url.rstrip("/") + "/",
            headers={
                "accept": "application/json",
                "content-type": "application/json",
            },
            timeout=httpx.Timeout(15.0),
            transport=transport,
        )

    def close(self) -> None:
        self._client.close()

    def get_wallet_snapshot(
        self,
        *,
        address: str,
        network_id: str,
    ) -> WalletHoldingsSnapshot:
        alchemy_network = _ALCHEMY_NETWORKS.get(network_id)
        if alchemy_network is None:
            raise WalletPortfolioProviderError(
                f"Unsupported wallet network: {network_id}"
            )

        try:
            normalized_address = normalize_evm_address(address)
        except InvalidWalletAddressError as exc:
            raise WalletPortfolioProviderError("Invalid EVM wallet address") from exc

        positions: dict[tuple[str, str], WalletHolding] = {}
        page_key: str | None = None
        seen_page_keys: set[str] = set()

        for _ in range(_MAX_PAGES):
            payload = self._fetch_page(
                address=normalized_address,
                network=alchemy_network,
                page_key=page_key,
            )

            self._raise_for_partial_failure(payload, network=alchemy_network)
            data = self._require_dict(payload.get("data"))
            tokens = data.get("tokens")

            if not isinstance(tokens, list):
                raise WalletPortfolioProviderError(
                    "Alchemy returned an invalid wallet token payload"
                )

            for token in tokens:
                holding = self._parse_holding(
                    token,
                    expected_address=normalized_address,
                    expected_network=alchemy_network,
                    network_id=network_id,
                )
                if holding is None:
                    continue

                positions[(holding.network_id, holding.asset_reference)] = holding

            next_page_key = data.get("pageKey")
            if next_page_key is None:
                break
            if not isinstance(next_page_key, str) or not next_page_key:
                raise WalletPortfolioProviderError(
                    "Alchemy returned an invalid pagination cursor"
                )
            if next_page_key in seen_page_keys:
                raise WalletPortfolioProviderError(
                    "Alchemy returned a repeated pagination cursor"
                )

            seen_page_keys.add(next_page_key)
            page_key = next_page_key
        else:
            raise WalletPortfolioProviderError(
                "Alchemy wallet pagination exceeded the safety limit"
            )

        return WalletHoldingsSnapshot(
            address=normalized_address,
            observed_at=datetime.now(UTC),
            positions=list(positions.values()),
        )

    def _fetch_page(
        self,
        *,
        address: str,
        network: str,
        page_key: str | None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "addresses": [
                {
                    "address": address,
                    "networks": [network],
                },
            ],
            "withMetadata": True,
            "withPrices": False,
            "includeNativeTokens": True,
            "includeErc20Tokens": True,
            "includeBlockMetadata": False,
        }
        if page_key is not None:
            body["pageKey"] = page_key

        try:
            response = self._client.post(
                f"{self._api_key}/assets/tokens/by-address",
                json=body,
            )
        except httpx.TimeoutException as exc:
            raise WalletPortfolioProviderError(
                "Alchemy wallet request timed out"
            ) from exc
        except httpx.HTTPError as exc:
            raise WalletPortfolioProviderError(
                "Alchemy wallet request failed"
            ) from exc

        if response.status_code == 429:
            raise WalletPortfolioRateLimitError(
                "Alchemy wallet rate limit reached"
            )
        if response.is_error:
            raise WalletPortfolioProviderError(
                f"Alchemy returned HTTP {response.status_code}"
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise WalletPortfolioProviderError(
                "Alchemy returned invalid JSON"
            ) from exc

        return self._require_dict(payload)

    @staticmethod
    def _raise_for_partial_failure(
        payload: dict[str, Any],
        *,
        network: str,
    ) -> None:
        error = payload.get("error")
        if error is None:
            return
        if not isinstance(error, dict):
            raise WalletPortfolioProviderError(
                "Alchemy returned an invalid partial-error payload"
            )

        partial_errors = error.get("partialErrors")
        if not partial_errors:
            return
        if not isinstance(partial_errors, list):
            raise WalletPortfolioProviderError(
                "Alchemy returned an invalid partial-error payload"
            )

        for item in partial_errors:
            if not isinstance(item, dict):
                continue

            failed_network = item.get("network")
            if failed_network in {network, None}:
                raise WalletPortfolioProviderError(
                    "Alchemy could not return a complete wallet snapshot"
                )

        raise WalletPortfolioProviderError(
            "Alchemy returned a partial wallet snapshot"
        )

    @classmethod
    def _parse_holding(
        cls,
        value: object,
        *,
        expected_address: str,
        expected_network: str,
        network_id: str,
    ) -> WalletHolding | None:
        token = cls._require_dict(value)

        response_address = token.get("address")
        if not isinstance(response_address, str):
            raise WalletPortfolioProviderError(
                "Alchemy token row is missing its wallet address"
            )

        try:
            normalized_response_address = normalize_evm_address(response_address)
        except InvalidWalletAddressError as exc:
            raise WalletPortfolioProviderError(
                "Alchemy returned an invalid wallet address"
            ) from exc

        if normalized_response_address != expected_address:
            raise WalletPortfolioProviderError(
                "Alchemy returned token data for an unexpected wallet"
            )

        response_network = token.get("network")
        if response_network != expected_network:
            raise WalletPortfolioProviderError(
                "Alchemy returned token data for an unexpected network"
            )

        raw_balance = cls._parse_balance(token.get("tokenBalance"))
        if raw_balance == 0:
            return None

        token_address = token.get("tokenAddress")
        if token_address is None:
            asset_kind = "native"
            asset_reference = "native"
        elif isinstance(token_address, str):
            try:
                asset_reference = normalize_evm_address(token_address)
            except InvalidWalletAddressError as exc:
                raise WalletPortfolioProviderError(
                    "Alchemy returned an invalid token contract address"
                ) from exc
            asset_kind = "erc20"
        else:
            raise WalletPortfolioProviderError(
                "Alchemy returned an invalid token identity"
            )

        metadata = token.get("tokenMetadata")
        metadata_dict = metadata if isinstance(metadata, dict) else {}

        decimals = cls._optional_int(metadata_dict.get("decimals"))
        if asset_kind == "native" and decimals is None:
            decimals = 18

        return WalletHolding(
            network_id=network_id,
            asset_kind=asset_kind,
            asset_reference=asset_reference,
            name=cls._optional_string(metadata_dict.get("name")),
            symbol=cls._optional_string(metadata_dict.get("symbol")),
            decimals=decimals,
            raw_balance=raw_balance,
        )

    @staticmethod
    def _parse_balance(value: object) -> int:
        if not isinstance(value, str) or not value:
            raise WalletPortfolioProviderError(
                "Alchemy returned an invalid token balance"
            )

        try:
            balance = int(value, 16) if value.startswith(("0x", "0X")) else int(value)
        except ValueError as exc:
            raise WalletPortfolioProviderError(
                "Alchemy returned an invalid token balance"
            ) from exc

        if balance < 0:
            raise WalletPortfolioProviderError(
                "Alchemy returned a negative token balance"
            )

        return balance

    @staticmethod
    def _optional_int(value: object) -> int | None:
        if isinstance(value, bool):
            return None
        if isinstance(value, int):
            return value
        if isinstance(value, str):
            try:
                return int(value)
            except ValueError:
                return None
        return None

    @staticmethod
    def _optional_string(value: object) -> str | None:
        if not isinstance(value, str):
            return None

        candidate = value.strip()
        return candidate or None

    @staticmethod
    def _require_dict(value: object) -> dict[str, Any]:
        if not isinstance(value, dict):
            raise WalletPortfolioProviderError(
                "Alchemy returned an invalid wallet payload"
            )
        return value
