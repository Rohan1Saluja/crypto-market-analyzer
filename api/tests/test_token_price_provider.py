from decimal import Decimal

import httpx
import pytest

from app.core.exceptions import MarketDataProviderError
from app.domain.wallet import ETHEREUM_MAINNET_NETWORK_ID
from app.providers.token_price import CoinGeckoTokenPriceProvider

USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"


def test_native_and_contract_prices_use_exact_decimal_parsing() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-cg-demo-api-key"] == "demo-key"
        assert request.url.params["vs_currencies"] == "usd"
        assert request.url.params["precision"] == "full"

        if request.url.path.endswith("/simple/price"):
            assert request.url.params["ids"] == "ethereum"
            return httpx.Response(
                200,
                text='{"ethereum":{"usd":3123.456789123456789}}',
            )

        assert request.url.path.endswith("/simple/token_price/ethereum")
        assert request.url.params["contract_addresses"] == f"{USDC},{WETH}"
        return httpx.Response(
            200,
            text=(
                "{"
                f'"{USDC}":{{"usd":1.0000123456789}},'
                f'"{WETH}":{{"usd":3120.123456789012345}}'
                "}"
            ),
        )

    provider = CoinGeckoTokenPriceProvider(
        api_key="demo-key",
        base_url="https://api.coingecko.test/api/v3",
        cache_ttl_seconds=60,
        transport=httpx.MockTransport(handler),
    )

    try:
        native = provider.get_native_price_usd(
            network_id=ETHEREUM_MAINNET_NETWORK_ID,
        )
        tokens = provider.get_token_prices_usd(
            network_id=ETHEREUM_MAINNET_NETWORK_ID,
            asset_references=[WETH.upper().replace("0X", "0x"), USDC],
        )
    finally:
        provider.close()

    assert native == Decimal("3123.456789123456789")
    assert tokens[USDC] == Decimal("1.0000123456789")
    assert tokens[WETH] == Decimal("3120.123456789012345")


def test_missing_contract_quote_is_omitted() -> None:
    provider = CoinGeckoTokenPriceProvider(
        api_key="demo-key",
        base_url="https://api.coingecko.test/api/v3",
        cache_ttl_seconds=60,
        transport=httpx.MockTransport(
            lambda _: httpx.Response(
                200,
                json={USDC: {"usd": 1}},
            ),
        ),
    )

    try:
        prices = provider.get_token_prices_usd(
            network_id=ETHEREUM_MAINNET_NETWORK_ID,
            asset_references=[USDC, WETH],
        )
    finally:
        provider.close()

    assert prices == {USDC: Decimal("1")}


def test_unsupported_price_network_is_rejected() -> None:
    provider = CoinGeckoTokenPriceProvider(
        api_key="demo-key",
        base_url="https://api.coingecko.test/api/v3",
        cache_ttl_seconds=60,
        transport=httpx.MockTransport(lambda _: httpx.Response(500)),
    )

    try:
        with pytest.raises(
            MarketDataProviderError,
            match="Unsupported pricing network",
        ):
            provider.get_native_price_usd(network_id="eip155:8453")
    finally:
        provider.close()
