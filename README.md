# Calyrn

**Signal, in context.**

Calyrn is a personal crypto intelligence product evolving from market research into portfolio-aware exposure, risk, and signal monitoring.

The public market and research surfaces are the discovery layer. The product roadmap adds identity, persistent state, read-only wallet ingestion, exposure-aware risk detection, and event monitoring without turning the product into a trading or custody system.

## Stack

- **Web:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **API:** FastAPI, Python
- **Market data:** CoinGecko through a provider abstraction
- **Deployment:** Vercel
- **Next platform step:** PostgreSQL + authentication + persistent user state

## Repository

```text
api/   FastAPI application, providers, services, schemas, tests
web/   Next.js application and product UI
```

## Local development

### API

```bash
cd api
uv sync
uv run fastapi dev app/main.py
```

### Web

```bash
cd web
pnpm install
cp .env.example .env.local
pnpm dev
```

By default the web application expects the API at `http://127.0.0.1:8000`.

## Quality checks

```bash
pnpm lint
pnpm build
cd api && uv run ruff check . && uv run pytest
```

## Brand

The product uses the **Mineral Noir** design system. See [`BRAND.md`](./BRAND.md) for positioning, product vocabulary, logo rules, color semantics, and voice.

## Current product surface

- Global crypto market overview
- Searchable market table and top movers
- Asset price history
- Technical snapshot
- Fundamentals
- News context
- Sentiment and participation data

## Direction

Calyrn is being built around a simple progression:

`Discover → Investigate → Watch → Own → Monitor → Review`

The goal is not to become another generic market dashboard. The long-term product is an evidence-first intelligence layer that can explain which market, security, tokenomics, and portfolio events are actually relevant to a user.
