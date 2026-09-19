import json

import httpx
import pytest

from app.core.exceptions import (
    WalletPortfolioProviderError,
    WalletPortfolioRateLimitError,
)
from app.domain.wallet import ETHEREUM_MAINNET_NETWORK_ID
from app.providers.alchemy import AlchemyWalletPortfolioProvider

WALLET = "0xabcdef0123456789abcdef0123456789abcdef01"
USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"


def test_get_wallet_snapshot_normalizes_and_paginates() -> None:
    requests: list[dict[str, object]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        requests.append(body)

        assert request.url.path.endswith(
            "/test-key/assets/tokens/by-address"
        )
        assert body["addresses"] == [
            {
                "address": WALLET,
                "networks": ["eth-mainnet"],
            },
        ]
        assert body["withMetadata"] is True
        assert body["withPrices"] is False
        assert body["includeNativeTokens"] is True
        assert body["includeErc20Tokens"] is True

        if "pageKey" not in body:
            return httpx.Response(
                200,
                json={
                    "data": {
                        "tokens": [
                            {
                                "address": WALLET.upper().replace("0X", "0x"),
                                "network": "eth-mainnet",
                                "tokenAddress": None,
                                "tokenBalance": "0xde0b6b3a7640000",
                                "tokenMetadata": {
                                    "decimals": 18,
                                    "name": "Ethereum",
                                    "symbol": "ETH",
                                },
                            },
                        ],
                        "pageKey": "page-2",
                    },
                },
            )

        assert body["pageKey"] == "page-2"
        return httpx.Response(
            200,
            json={
                "data": {
                    "tokens": [
                        {
                            "address": WALLET,
                            "network": "eth-mainnet",
                            "tokenAddress": USDC.upper().replace("0X", "0x"),
                            "tokenBalance": "2500000",
                            "tokenMetadata": {
                                "decimals": 6,
                                "name": "USD Coin",
                                "symbol": "USDC",
                            },
                        },
                        {
                            "address": WALLET,
                            "network": "eth-mainnet",
                            "tokenAddress": (
                                "0x1111111111111111111111111111111111111111"
                            ),
                            "tokenBalance": "0x0",
                            "tokenMetadata": {
                                "decimals": 18,
                                "name": "Zero",
                                "symbol": "ZERO",
                            },
                        },
                    ],
                },
            },
        )

    provider = AlchemyWalletPortfolioProvider(
        api_key="test-key",
        base_url="https://api.g.alchemy.test/data/v1",
        transport=httpx.MockTransport(handler),
    )

    try:
        snapshot = provider.get_wallet_snapshot(
            address=f"  {WALLET.upper().replace('0X', '0x')}  ",
            network_id=ETHEREUM_MAINNET_NETWORK_ID,
        )
    finally:
        provider.close()

    assert snapshot.address == WALLET
    assert len(snapshot.positions) == 2
    assert len(requests) == 2

    eth, usdc = snapshot.positions
    assert eth.asset_kind == "native"
    assert eth.asset_reference == "native"
    assert eth.symbol == "ETH"
    assert eth.decimals == 18
    assert eth.raw_balance == 1_000_000_000_000_000_000

    assert usdc.asset_kind == "erc20"
    assert usdc.asset_reference == USDC
    assert usdc.symbol == "USDC"
    assert usdc.decimals == 6
    assert usdc.raw_balance == 2_500_000


def test_get_wallet_snapshot_rejects_partial_network_failure() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "data": {"tokens": []},
                "error": {
                    "partialErrors": [
                        {
                            "network": "eth-mainnet",
                            "message": "upstream timeout",
                        },
                    ],
                },
            },
        )

    provider = AlchemyWalletPortfolioProvider(
        api_key="test-key",
        base_url="https://api.g.alchemy.test/data/v1",
        transport=httpx.MockTransport(handler),
    )

    try:
        with pytest.raises(
            WalletPortfolioProviderError,
            match="complete wallet snapshot",
        ):
            provider.get_wallet_snapshot(
                address=WALLET,
                network_id=ETHEREUM_MAINNET_NETWORK_ID,
            )
    finally:
        provider.close()


def test_get_wallet_snapshot_maps_rate_limit() -> None:
    provider = AlchemyWalletPortfolioProvider(
        api_key="test-key",
        base_url="https://api.g.alchemy.test/data/v1",
        transport=httpx.MockTransport(
            lambda _: httpx.Response(429, json={"message": "rate limited"}),
        ),
    )

    try:
        with pytest.raises(WalletPortfolioRateLimitError):
            provider.get_wallet_snapshot(
                address=WALLET,
                network_id=ETHEREUM_MAINNET_NETWORK_ID,
            )
    finally:
        provider.close()


def test_get_wallet_snapshot_rejects_unsupported_network() -> None:
    provider = AlchemyWalletPortfolioProvider(
        api_key="test-key",
        base_url="https://api.g.alchemy.test/data/v1",
        transport=httpx.MockTransport(
            lambda _: httpx.Response(500),
        ),
    )

    try:
        with pytest.raises(
            WalletPortfolioProviderError,
            match="Unsupported wallet network",
        ):
            provider.get_wallet_snapshot(
                address=WALLET,
                network_id="eip155:8453",
            )
    finally:
        provider.close()
