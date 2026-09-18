from fastapi.testclient import TestClient


def test_coin_detail(client: TestClient) -> None:
    response = client.get("/api/v1/coins/bitcoin")

    assert response.status_code == 200
    payload = response.json()

    assert payload["coin"]["symbol"] == "BTC"
    assert payload["description"] == "Bitcoin test fixture."
    assert "technicals" not in payload


def test_coin_price_history(client: TestClient) -> None:
    response = client.get(
        "/api/v1/coins/bitcoin/price-history",
        params={"range": "7d"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert len(payload) == 168
    assert payload[0]["timestamp"] == 1_700_000_000_000
    assert payload[0]["price"] > 0


def test_coin_technicals_use_historical_prices(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/coins/bitcoin/technicals")

    assert response.status_code == 200
    payload = response.json()

    assert 0 <= payload["rsi"] <= 100
    assert payload["support"] > 0
    assert payload["resistance"] >= payload["support"]
    assert payload["timeframe"] == "1h"


def test_coin_research_has_stable_fallback_shape(client: TestClient) -> None:
    response = client.get("/api/v1/coins/bitcoin/research")

    assert response.status_code == 200
    payload = response.json()

    assert payload["fundamentals"]["categories"] == []
    assert payload["sentiment"]["votesUpPercentage"] is None


def test_coin_news_has_stable_fallback_shape(client: TestClient) -> None:
    response = client.get("/api/v1/coins/bitcoin/news")

    assert response.status_code == 200
    assert response.json() == []


def test_unknown_coin_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/coins/not-a-coin")

    assert response.status_code == 404


def test_unknown_coin_research_returns_404(client: TestClient) -> None:
    response = client.get("/api/v1/coins/not-a-coin/research")

    assert response.status_code == 404
