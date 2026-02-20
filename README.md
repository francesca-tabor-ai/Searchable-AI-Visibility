# Searchable — AI Citation Tracking

AI Search Visibility platform: track which sources (URLs) AI models cite for given queries.

## Stack

- **Next.js 14** (App Router), **TypeScript**, **Drizzle ORM**, **PostgreSQL** (Railway, Neon, or local).

## Project structure (production-ready)

- **`src/`** — All app code (App Router, API routes, components, db, lib).
- **Absolute imports** — Use `@/components/...`, `@/db/...`, `@/lib/...` (see `tsconfig.json` paths).
- **Environment** — Copy `.env.example` to `.env` and set `DATABASE_URL`, and optionally `NEXTAUTH_SECRET`, `AI_COLLECTOR_API_KEY`. See [Deployment](#deployment).
- **Drizzle** — Schema and types in `src/db/schema.ts` (Queries, Responses, Citations, domain_visibility_scores, url_performance_metrics, etc.). Push with `npm run db:push` or `db:push:pg`.
- **Deploy** — `deploy.sh` (or `npm run deploy`) runs schema push then build. Railway can use **`nixpacks.toml`** so the build phase runs migrations automatically.
- **Lint** — Strict ESLint via `.eslintrc.json` (extends `next/core-web-vitals`). Run `npm run lint`. If ESLint is not installed, add `eslint` and `eslint-config-next` as dev dependencies.
- **Design** — **[docs/DESIGN-LANGUAGE.md](./docs/DESIGN-LANGUAGE.md)** — Searchable design language: SaaS dark mode, data-first, action-oriented. Use for all new UI components.

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
- **`GET /api/visibility-scores/overview?domain=...`** — Overview payload for the dashboard: current score, trend, and last 30 days history (for sparkline). Omit `domain` to use the top domain.
- **Dashboard:** **`/dashboard`** — Overview component: large Visibility Score (0–100), trend indicator (+/− % in green/red), 30-day sparkline (Tremor), and domain selector. Data via SWR with 1-hour revalidation.
- **Visibility Trends:** **`GET /api/trends?domain=...&range=7d|30d|90d`** — Daily visibility score (7-day rolling average) and citation counts for the target and top 2 competitors. **`/dashboard/trends`** — Multi-line chart (you vs competitors), summary cards (Current, 30d Change, Peak), and time-range tabs (7d / 30d / 90d) with smooth transitions (framer-motion).
- **Cron:** `GET /api/cron/visibility-score` runs every 24h (e.g. Vercel Cron). On **Railway**, use the standalone worker: `npm run worker:visibility-score:once` (Cron) or `npm run worker:visibility-score` (long-running). Same `DATABASE_URL`; logs start, duration, and success/failure. See [DEPLOYMENT.md](./DEPLOYMENT.md#railway-visibility-score-worker-scheduled-job).

### Competitive Benchmarking

- **`GET /api/competitors?domain=target.com`** — Top 5 overlap competitors (domains cited in the same queries as the target), ranked by Visibility Score. Returns `visibilityScore`, `overlapPercent` (shared_queries / total_queries_for_target), `shareOfVoice` (citation share in overlapping queries), and `rank`. Data is read from pre-aggregated `competitor_metrics` when present; otherwise computed on the fly.
- **`GET /api/competitors/compare?domain=...&competitor=...&query_id=...`** — Query-level comparison: for the given query, returns side-by-side `rankInQuery` and `citationCount` for target and competitor (logical view over citations + queries).
- **Pre-aggregation:** `POST /api/competitors/refresh` (optional body: `{ "domain": "target.com" }`) populates `competitor_metrics` for fast dashboard access. Secure with `CRON_SECRET` when used from a cron. Indexes on `citations(domain)` and `responses(query_id)` optimize the discovery query.

### Content attribution (URL-level)

- **`GET /api/pages?domain=target.com`** — Paginated list of URLs with page-level metrics: `citationCount`, `uniqueQueryCount`, `avgPosition` (average rank within responses). Optional query params: `page`, `limit` (default 20, max 100), `view` = `all` | `top_performers` | `opportunity`. When a URL is mapped to a canonical (redirect/duplicate), the response includes `canonicalUrl`.
- **URL normalization:** `normalizeUrl()` (used at ingest and in aggregation) strips query params (optional allowlist), trailing slashes, and lowercases host and path (e.g. `https://Nike.com/Running?utm=123/` → `https://nike.com/running`).
- **Aggregation:** Run `npm run script:url-metrics` to populate `url_performance_metrics` from citations. Creates one row per normalized URL with citation count, distinct query count, average position, and **last_cited_at** (most recent citation time; use to spot decaying content).
- **URL health worker (Railway):** Optional `npm run worker:url-health:once` or `worker:url-health` pings top-cited URLs (HEAD), stores results in `url_health_check` (404 detection). See [DEPLOYMENT.md](./DEPLOYMENT.md#railway-url-performance-metrics-high-cardinality).
- **Views (Postgres):** After creating the table, run `psql $DATABASE_URL -f scripts/create-url-views.sql` to add `top_performers` (all URLs, query with `ORDER BY citation_count DESC`) and `opportunity_urls` (URLs with `avg_position > 3` — cited but low rank).
- **Redirects / canonical:** To group alternate URLs (e.g. `nike.com/shoes` and `nike.com/products/shoes`) that cite the same content, insert rows into `url_canonical_mapping` (from_url → to_url). The pages API returns `canonicalUrl` when present so you can display or group by canonical.

## Citation extraction

- **Inline links:** `[Source](https://example.com)`
- **Reference lines:** `1. https://example.com`
- **Text-style:** `(example.com)` or `https://example.com` in prose

URLs are normalized: `https`, lowercase host and path, no query params (unless allowlisted via `keepQueryParams`), no trailing slash. Domains are stored without `www` (e.g. `nike.com`). Duplicate citations per response are deduplicated by unique `(response_id, url)`.

## Scripts

- `npm run dev` — Start dev server
- `npm run db:push` / `npm run db:push:pg` — Push schema to PostgreSQL
- `npm run db:generate` — Generate migrations
- `npm run db:studio` — Drizzle Studio
- `npm run script:url-metrics` — Populate `url_performance_metrics` from citations (requires `DATABASE_URL`)
- `npm run worker:url-health:once` — Ping top-cited URLs once and store health in `url_health_check`
- `npm run worker:url-health` — Same, then every 24h (set `URL_HEALTH_TOP_N` to change count, default 500)

## Deployment

- **Vercel (frontend + API):** Edge runtime for `/api/ingest`, cron, analytics, preview per PR — see **[VERCEL.md](./VERCEL.md)**.
- **Railway:** See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — PostgreSQL + Node.js, `DATABASE_URL`, optional Redis, health check at `/api/health`.
- **Free tier:** **Neon.tech** (0.5 GiB, unlimited DBs) as Postgres; use with either Vercel or Railway.
- **Free stack (no/minimal cost):** **[docs/FREE-STACK.md](./docs/FREE-STACK.md)** — Neon (primary DB), TiDB Cloud (analytical), Upstash (Redis), Cloudflare R2 (storage), Clerk/NextAuth (auth).
