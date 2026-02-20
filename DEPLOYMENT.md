# Deployment — Railway, PostgreSQL, Redis, Neon

## Railway: PostgreSQL + Node.js

1. **Create a project** at [railway.app](https://railway.app) and add:
   - **PostgreSQL** (Add → Database → PostgreSQL). Railway sets `DATABASE_URL` automatically when you add the Postgres plugin to the same project as your service.
   - **Node.js service** (deploy from this repo; Nixpacks will detect Next.js).

2. **Configure the Node.js service**
   - **Variables:** Ensure `DATABASE_URL` is set (Railway links it from the Postgres service, or set it manually).
   - **Optional:** Add **Redis** (Add → Database → Redis) for a future async queue. Set `REDIS_URL` on the Node service (Railway can reference the Redis plugin variable).
   - **Health check:** Railway uses the path in `railway.toml`. This repo sets `healthcheckPath = "/api/health"`. The app returns `200` when the database is up and `503` when it is down.

3. **Database initialization (first deploy or new DB)**  
   After the first deploy, run Drizzle push against the deployed Postgres (e.g. from your machine using the same `DATABASE_URL`):

   ```bash
   DATABASE_URL="postgresql://user:pass@host:port/railway" npx drizzle-kit push
   ```

   Or add a one-off job / deploy script that runs `npm run db:push:pg` with `DATABASE_URL` set. Railway does not run build scripts after deploy, so you must run the push once when you create a new Postgres instance.

4. **Free tier / trial credits**  
   If Railway trial credits run out, keep the Node app on Railway and move the database to Neon (see below).

---

## Railway: Visibility Score worker (scheduled job)

The **Searchable Visibility Score™** calculation can run on Railway in two ways. The worker uses the **same `DATABASE_URL`** as the main app (reference it from the same project or set it on the worker service).

### Option A: Railway Cron (recommended)

Add a **Cron** or **one-off run** service that executes the job every 24h:

- **Command:** `npm run worker:visibility-score:once`
- **Schedule:** e.g. daily at 07:00 UTC (configure in Railway Cron / cron expression).
- **Variables:** Set `DATABASE_URL` (link from Postgres or copy from the main app service).

Each run logs to stdout so you see **start**, **duration**, and **success/failure** in Railway’s centralized logs.

### Option B: Long-running worker process

Add a separate **Service** that runs the worker in a loop (runs immediately, then every 24h):

- **Start command:** `npm run worker:visibility-score`
- **Variables:** Same `DATABASE_URL` as the main app.

Logs are JSON lines: `visibility_score_start`, `visibility_score_success` (with `durationMs`, `computed`), `visibility_score_failure` (with `durationMs`, `error`).

### Logging

All runs log structured JSON to stdout for Railway:

- `event: "visibility_score_start"` — job started
- `event: "visibility_score_success"` — `durationMs`, `computed`, `at`
- `event: "visibility_score_failure"` — `durationMs`, `error` (and `stack` in dev)

### Scalability: Background Worker + Redis queue

If the calculation becomes heavy (many domains or large aggregations), you can move to a **Railway Background Worker** and queue only the domains that need re-scoring:

1. Add a **Redis** plugin and set `REDIS_URL` on the worker.
2. Instead of recomputing all domains in one job, push domain IDs (or “recompute all” tokens) to a Redis list/stream.
3. Run a long-lived worker that pops from the queue and runs the visibility score logic per domain (or in batches), writing to `domain_visibility_scores`.
4. Trigger the queue from the main app (e.g. after ingest) or from a lightweight cron that only enqueues “full run” or delta domains.

The current codebase does not include the queue producer/consumer; add it when you need this scaling path.

---

## Railway: High-performance aggregation (PostgreSQL)

Heavy competitor-overlap and visibility logic use JOINs on `citations` and `responses`. The following keep the Railway Postgres instance fast:

### Indexes

- **`citations(domain)`** — `citations_domain_idx` (already in schema).
- **`citations(domain, query_id)`** — **`idx_citations_domain_query`** for overlap lookups. The schema denormalizes `query_id` on `citations` (set on ingest) so this composite index can be used without joining to `responses` for domain+query filters.
- **`responses(query_id)`** — `responses_query_id_idx` (already in schema).

After adding the `query_id` column to `citations`, backfill existing rows and then push schema:

```bash
# After db:push, backfill so the composite index is effective:
psql "$DATABASE_URL" -f scripts/backfill-citations-query-id.sql
```

### Materialized view (competitor leaderboard)

A materialized view stores a snapshot of the competitor leaderboard for fast reads and avoids re-running heavy JOINs on every request:

1. **Create once** (after `competitor_metrics` exists):

   ```bash
   psql "$DATABASE_URL" -f scripts/create-competitor-leaderboard-mv.sql
   ```

2. **Refresh daily** (e.g. after the competitor refresh cron): the app runs `REFRESH MATERIALIZED VIEW CONCURRENTLY competitor_leaderboard` at the end of `POST /api/competitors/refresh`. So if you run competitor refresh daily, the MV is refreshed in the same run.

If the MV does not exist yet, the refresh step is skipped and the response includes `leaderboardMV: { refreshed: false, error: "..." }`. Reads still use `competitor_metrics` until the MV is created.

### Monitoring (Railway Metrics)

- In Railway, open the **Metrics** tab for the Postgres (and app) service.
- During **aggregation** (visibility score cron, competitor refresh), watch for **CPU and memory** spikes. If they stay high or time out:
  - Ensure the indexes above exist and that `citations.query_id` is backfilled.
  - Consider refreshing the competitor leaderboard MV only (read from MV) and running the full competitor discovery less often.
  - Consider the Redis overlap alternative below.

---

## Alternative: Upstash Redis for overlap (SINTER)

If the overlap logic (finding domains that share queries with a target) is too slow on Postgres, you can use **Upstash Redis** (or any Redis) to store **sets of `query_id` per domain** and use **`SINTER`** (set intersection) to find overlapping query IDs:

1. **Key pattern:** `domain:query_ids:{domain}` — a SET of query IDs where that domain was cited.
2. **On ingest (or in a batch job):** for each citation, `SADD domain:query_ids:{domain} {query_id}`.
3. **Overlap:** for target `T` and candidate `C`, `SINTER domain:query_ids:{T} domain:query_ids:{C}` gives shared query IDs; `SCARD` of the result = shared_queries. Repeat for all candidate domains (or maintain a list of domains and iterate).
4. **Total queries for target:** `SCARD domain:query_ids:{T}` = total_queries_for_target.

Then compute **overlap_score = shared_queries / total_queries_for_target** in the app. Visibility score and rank can still come from Postgres (`domain_visibility_scores`). This moves the heavy overlap work to Redis and keeps Postgres for durable storage and visibility scores.

The codebase does not implement this path yet; add it when you need to scale overlap discovery.

---

## Free tier: Neon (PostgreSQL)

Use [Neon.tech](https://neon.tech) for PostgreSQL when you want a free tier (e.g. 0.5 GiB storage, unlimited databases).

1. Create a project at Neon and copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
2. In Railway (or your host), set **`DATABASE_URL`** to this Neon connection string.
3. Push the schema once from your machine or a CI step:

   ```bash
   DATABASE_URL="postgresql://..." npx drizzle-kit push
   ```

No code changes are required; the app uses `DATABASE_URL` for Drizzle and works with Neon’s serverless Postgres.

---

## Redis (optional queue)

For high volume, you can process citation extraction asynchronously via a queue (e.g. Redis-backed).

- **Railway:** Add a Redis plugin and set `REDIS_URL` on the Node service.
- **Health:** `GET /api/health` reports Redis as `up` / `down` / `skipped` (skipped when `REDIS_URL` is unset).
- Queue consumers and job definitions are not included in this repo; add them when you implement async processing.

---

## Environment summary

| Variable        | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `DATABASE_URL` | Yes      | PostgreSQL connection string (Railway or Neon). Required at runtime; for CI builds without a DB, set any placeholder (e.g. `postgresql://localhost:5432/dummy`) so the app builds. |
| `REDIS_URL`    | No       | Redis URL if using a queue; health check reports status. |
| `PORT`         | Set by Railway | Next.js listens on `PORT` in production.   |

---

## Health check

- **Endpoint:** `GET /api/health`
- **Success:** HTTP `200` with `"status": "ok"` or `"degraded"` (DB up; Redis down is degraded).
- **Failure:** HTTP `503` with `"status": "error"` when the database is unreachable.

Railway uses this endpoint to decide when a deployment is healthy; ensure `DATABASE_URL` is correct so the health check can pass after deploy.
