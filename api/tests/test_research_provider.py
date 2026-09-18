import httpx

from app.providers.research import CoinGeckoResearchProvider


def test_coin_research_is_mapped_from_coingecko_payload() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-cg-demo-api-key"] == "demo-key"
        assert request.url.params["community_data"] == "true"
        assert request.url.params["developer_data"] == "true"

        return httpx.Response(
            200,
            json={
                "market_data": {
                    "circulating_supply": 19_900_000,
                    "total_supply": 19_900_000,
                    "max_supply": 21_000_000,
                    "fully_diluted_valuation": {"usd": 1_500_000_000_000},
                    "ath": {"usd": 120_000},
                    "ath_change_percentage": {"usd": -8.2},
                    "ath_date": {"usd": "2026-08-01T00:00:00.000Z"},
                    "atl": {"usd": 67.81},
                    "atl_change_percentage": {"usd": 160_000},
                    "atl_date": {"usd": "2013-07-06T00:00:00.000Z"},
                },
                "community_data": {"reddit_subscribers": 7_000_000},
                "developer_data": {
                    "stars": 85_000,
                    "forks": 40_000,
                    "commit_count_4_weeks": 180,
                },
                "sentiment_votes_up_percentage": 78.3,
                "sentiment_votes_down_percentage": 21.7,
                "watchlist_portfolio_users": 2_500_000,
                "genesis_date": "2009-01-03",
                "hashing_algorithm": "SHA-256",
                "categories": ["Layer 1", "Proof of Work"],
                "links": {
                    "homepage": ["https://bitcoin.org"],
                    "blockchain_site": ["https://mempool.space"],
                },
            },
        )

    provider = CoinGeckoResearchProvider(
        api_key="demo-key",
        base_url="https://api.coingecko.test/api/v3",
        cache_ttl_seconds=300,
        transport=httpx.MockTransport(handler),
    )

    try:
        research = provider.get_coin_research("bitcoin")
    finally:
        provider.close()

    assert research is not None
    assert research.fundamentals.max_supply == 21_000_000
    assert research.fundamentals.hashing_algorithm == "SHA-256"
    assert research.fundamentals.homepage_url == "https://bitcoin.org"
    assert research.sentiment.votes_up_percentage == 78.3
    assert research.sentiment.github_commits_4_weeks == 180


def test_unknown_coin_research_returns_none() -> None:
    provider = CoinGeckoResearchProvider(
        api_key="demo-key",
        base_url="https://api.coingecko.test/api/v3",
        cache_ttl_seconds=300,
        transport=httpx.MockTransport(lambda _: httpx.Response(404)),
    )

    try:
        research = provider.get_coin_research("unknown")
    finally:
        provider.close()

    assert research is None
