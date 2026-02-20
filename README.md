# Searchable — AI Citation Tracking

AI Search Visibility platform: track which sources (URLs) AI models cite for given queries.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Drizzle ORM**, **PostgreSQL** (Railway, Neon, or local).

## Setup

```bash
npm install
```

Set `DATABASE_URL` to a PostgreSQL connection string (see [Deployment](#deployment) for Railway/Neon), then:

```bash
npm run db:push
# or explicitly: npm run db:push:pg
npm run dev
```

## API

### `POST /api/ingest`

Ingest a raw AI response; extracts citations, normalizes URLs, and stores query, response, and citations in one transaction.

**Body (JSON):**

- `query` (string) — User query that triggered the response
- `model` (string) — Model name (e.g. `gpt-4`, `claude-3`)
- `rawResponseText` (string) — Full AI response text

**Example:**

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"query":"best running shoes","model":"gpt-4","rawResponseText":"See [Nike](https://www.nike.com/running) and 1. https://adidas.com/run"}'
```

**Response (201):** `{ "queryId", "responseId", "citationCount" }`

### `GET /api/citations`

List citations with optional filters.

**Query params:**

- `domain` — Filter by normalized domain (e.g. `nike.com`)
- `model` — Filter by model name

**Example:**

```bash
curl "http://localhost:3000/api/citations?domain=nike.com&model=gpt-4"
```

**Response (200):** `{ "citations": [ { "id", "responseId", "url", "domain", "createdAt", "model" }, ... ] }`

### `GET /api/health`

Health check for deployments (e.g. Railway). Returns `200` when the database is up, `503` when it is down. If `REDIS_URL` is set, also reports Redis status (optional queue for async processing).

**Response (200):** `{ "status": "ok" | "degraded" | "error", "checks": { "database": { "status": "up" }, "redis": { "status": "up" | "down" | "skipped" } }, ... }`

### Searchable Visibility Score™

- **`GET /api/visibility-scores`** — List latest score per domain (0–100), `previousScore`, and `change` (current − previous day). Computed by a daily cron.
- **Cron:** `GET /api/cron/visibility-score` runs every 24h (e.g. 07:00 UTC on Vercel), aggregates citation/share/coverage/position/recency, and upserts into `domain_visibility_scores`. Secure with `CRON_SECRET`.

## Citation extraction

- **Inline links:** `[Source](https://example.com)`
- **Reference lines:** `1. https://example.com`
- **Text-style:** `(example.com)` or `https://example.com` in prose

URLs are normalized to `https` and domains stored without `www` (e.g. `nike.com`). Duplicate citations per response are deduplicated by unique `(response_id, url)`.

## Scripts

- `npm run dev` — Start dev server
- `npm run db:push` / `npm run db:push:pg` — Push schema to PostgreSQL
- `npm run db:generate` — Generate migrations
- `npm run db:studio` — Drizzle Studio

## Deployment

- **Vercel (frontend + API):** Edge runtime for `/api/ingest`, cron, analytics, preview per PR — see **[VERCEL.md](./VERCEL.md)**.
- **Railway:** See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — PostgreSQL + Node.js, `DATABASE_URL`, optional Redis, health check at `/api/health`.
- **Free tier:** **Neon.tech** (0.5 GiB, unlimited DBs) as Postgres; use with either Vercel or Railway.
