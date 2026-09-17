# Crypto Market Analyzer API

FastAPI backend for Crypto Market Analyzer.

Runtime market data comes from CoinGecko. There is no seeded/demo market-data fallback.

## Local setup

Create `api/.env` with your CoinGecko Demo API key:

```env
CMA_COINGECKO_API_KEY=your-key
```

Then:

```bash
cd api
uv sync
uv run fastapi dev
```

The API starts at `http://127.0.0.1:8000`.

Interactive documentation:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

## Checks

```bash
uv run ruff check .
uv run pytest
```

## API

```text
GET /health
GET /api/v1/markets/overview
GET /api/v1/markets
GET /api/v1/coins/{coin_id}
GET /api/v1/coins/{coin_id}/price-history?range=7d
GET /api/v1/coins/{coin_id}/technicals
```

## Data flow

```text
HTTP route
    ↓
MarketService
    ↓
CoinGeckoMarketProvider
    ↓
CoinGecko Demo API
```

The backend caches market responses briefly to conserve upstream quota. Technical indicators are
calculated by this API from CoinGecko hourly historical prices; they are not seeded or randomly
generated.

Tests use isolated fixtures and mocked HTTP responses. Test fixtures are never used by runtime code.
