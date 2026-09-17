from fastapi.testclient import TestClient


def test_market_overview(client: TestClient) -> None:
    response = client.get("/api/v1/markets/overview")

    assert response.status_code == 200
    payload = response.json()

    assert payload[0]["label"] == "Global market cap"
    assert payload[0]["value"] == "$2.42T"


def test_market_list_uses_frontend_contract(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/markets")

    assert response.status_code == 200
    bitcoin = response.json()[0]

    assert bitcoin["id"] == "bitcoin"
    assert bitcoin["change24h"] == 2.48
    assert bitcoin["marketCap"] == 1_328_000_000_000
    assert bitcoin["volume24h"] == 38_200_000_000
    assert bitcoin["imageUrl"] == "https://example.test/bitcoin.png"
