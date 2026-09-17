from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_coin_detail() -> None:
    response = client.get("/api/v1/coins/bitcoin")

    assert response.status_code == 200
    payload = response.json()

    assert payload["coin"]["symbol"] == "BTC"
    assert payload["technicals"]["momentum"] == "Bullish"


def test_coin_candles() -> None:
    response = client.get(
        "/api/v1/coins/bitcoin/candles",
        params={"range": "7d"},
    )

    assert response.status_code == 200
    payload = response.json()

    assert len(payload) == 12
    assert payload[-1]["label"] == "Now"


def test_unknown_coin_returns_404() -> None:
    response = client.get("/api/v1/coins/not-a-coin")

    assert response.status_code == 404
