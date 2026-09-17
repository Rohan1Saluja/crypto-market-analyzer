import httpx

from app.providers.coingecko import CoinGeckoMarketProvider


def test_markets_are_mapped_from_coingecko_payload() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-cg-demo-api-key"] == "demo-key"
        assert request.url.params["sparkline"] == "true"
        assert request.url.params["price_change_percentage"] == "1h,24h,7d"

        return httpx.Response(
            200,
            json=[
                {
                    "id": "bitcoin",
                    "symbol": "btc",
                    "name": "Bitcoin",
                    "image": "https://example.test/btc.png",
                    "current_price": 67_000,
                    "market_cap": 1_300_000_000_000,
                    "market_cap_rank": 1,
                    "total_volume": 35_000_000_000,
                    "price_change_percentage_24h": 1.2,
                    "sparkline_in_7d": {
                        "price": [60_000 + index for index in range(168)]
                    },
                    "price_change_percentage_1h_in_currency": 0.1,
                    "price_change_percentage_24h_in_currency": 1.2,
                    "price_change_percentage_7d_in_currency": 3.4,
                }
            ],
        )

    provider = CoinGeckoMarketProvider(
        api_key="demo-key",
        base_url="https://api.coingecko.test/api/v3",
        market_cache_ttl_seconds=60,
        history_cache_ttl_seconds=300,
        transport=httpx.MockTransport(handler),
    )

    try:
        coins = provider.list_markets()
    finally:
        provider.close()

    assert coins[0].id == "bitcoin"
    assert coins[0].price == 67_000
    assert coins[0].change_7d == 3.4
    assert len(coins[0].sparkline) == 24


def test_market_chart_is_mapped_to_price_history() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["days"] == "7"
        assert request.url.params["interval"] == "hourly"

        return httpx.Response(
            200,
            json={
                "prices": [[1000, 10.0], [2000, 11.0]],
                "market_caps": [[1000, 100.0], [2000, 110.0]],
                "total_volumes": [[1000, 50.0], [2000, 60.0]],
            },
        )

    provider = CoinGeckoMarketProvider(
        api_key="demo-key",
        base_url="https://api.coingecko.test/api/v3",
        market_cache_ttl_seconds=60,
        history_cache_ttl_seconds=300,
        transport=httpx.MockTransport(handler),
    )

    try:
        history = provider.get_price_history(
            "bitcoin",
            time_range="7d",
        )
    finally:
        provider.close()

    assert history is not None
    assert history[1].price == 11.0
    assert history[1].market_cap == 110.0
    assert history[1].volume_24h == 60.0
