# Calyrn persistence foundation

PostgreSQL is Calyrn's source of durable private user state.

## What this layer teaches

- ORM models are application objects mapped to relational tables.
- A migration is a versioned database schema change, not `create_all()` in production.
- A `Session` is the unit-of-work boundary for database reads and writes.
- Liveness answers "is the process running?"; readiness answers "can this instance serve requests that depend on its infrastructure?"
- Foreign keys and unique constraints protect invariants even when application code is wrong.

## Current schema

`users`
- durable Calyrn user identity
- `auth_subject` remains provider-neutral

`watchlist_items`
- belongs to one user
- stores the CoinGecko asset id rather than duplicating market data
- optionally stores the user's thesis for that asset
- unique on `(user_id, asset_id)`

`tracked_wallets`
- a read-only address tracked by one Calyrn user
- stores canonical address identity, not proof of wallet ownership
- begins with the `evm` address family
- keeps synchronization freshness/status separate from wallet identity
- unique on `(user_id, address_family, address)`

`wallet_positions`
- current normalized on-chain balances for a tracked wallet
- chain identity uses a canonical network id such as `eip155:1`
- native assets and ERC-20 contracts have distinct asset identities
- raw balances use exact decimal storage rather than floating point
- unique on `(wallet_id, network_id, asset_reference)`

Market prices and portfolio percentages are intentionally not persisted here. They are public/derived context and belong in the exposure read path.

## Local setup

From the repository root:

```bash
docker compose up -d postgres
```

From `api/`:

```bash
uv sync
cp .env.example .env
uv run alembic upgrade head
uv run fastapi dev
```

Verify:

```text
GET /health        -> process liveness
GET /health/ready  -> process + PostgreSQL readiness
```

## Migration workflow

After changing an ORM model:

```bash
uv run alembic revision --autogenerate -m "describe the schema change"
```

Then inspect the generated migration before running it. Autogenerate creates a candidate migration; it is not a substitute for reviewing the SQL/schema change.

Apply migrations:

```bash
uv run alembic upgrade head
```

Roll back one migration during local development:

```bash
uv run alembic downgrade -1
```

## Production rule

Never call `Base.metadata.create_all()` from the FastAPI startup path. Production schema changes go through Alembic so they are explicit, reviewable, and reversible.
