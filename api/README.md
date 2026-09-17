# Crypto Market Analyzer API

FastAPI backend for Crypto Market Analyzer.

## Local setup

Install [uv](https://docs.astral.sh/uv/) if it is not already available, then:

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

## Initial API

```text
GET /health
GET /api/v1/markets/overview
GET /api/v1/markets
GET /api/v1/coins/{coin_id}
GET /api/v1/coins/{coin_id}/candles?range=7d
GET /api/v1/coins/{coin_id}/technicals
```

## Architecture

```text
HTTP router
    ↓
service
    ↓
provider
```

The first provider is intentionally seeded in-memory data. External market APIs will be added behind
the provider interface so the HTTP contract and frontend do not need to change when the data source
changes.
