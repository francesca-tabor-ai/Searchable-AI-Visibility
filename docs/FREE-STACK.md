# Searchable Free Stack — Database & Service Selection

If Railway's $5/mo or trial credits aren't enough, use this **free-tier strategy** so you can run Searchable with minimal or zero fixed cost.

## Free stack overview

| Component       | Provider        | Why? |
| :---            | :---            | :--- |
| **Primary DB**  | **Neon.tech**   | 500 MB free, serverless (scales to zero), great for Next.js and Drizzle. |
| **Analytical DB** | **TiDB Cloud** | 25 GB free; handles heavy `GROUP BY` and `JOIN` queries for competitive overlap and visibility aggregation (Feature 2 & 3). |
| **Cache / Queue** | **Upstash**   | Free tier for Redis. Ideal for rate-limiting the AI Collector and optional overlap logic (e.g. `SINTER`). |
| **File Storage** | **Cloudflare R2** | 10 GB free. Store raw AI responses (JSON) to save primary DB space. |
| **Auth**        | **Clerk** or **NextAuth** | Generous free tiers for user management. |

---

## Primary DB: Neon (PostgreSQL)

- **Use for:** All core tables (queries, responses, citations, domain_visibility_scores, url_performance_metrics, etc.). This is your **`DATABASE_URL`**.
- **Setup:** Create a project at [Neon.tech](https://neon.tech), copy the connection string, set `DATABASE_URL` in Vercel/Railway. Run `npm run db:push` once.
- **Details:** See [DEPLOYMENT.md](../DEPLOYMENT.md#free-tier-neon-postgresql). No code changes; Drizzle works with Neon’s serverless Postgres.

---

## Analytical DB: TiDB Cloud (optional)

- **Use for:** Offloading heavy analytical queries (competitor discovery, visibility aggregation, trends) when Neon or a single Postgres instance becomes a bottleneck.
- **Why:** 25 GB free tier; TiDB is MySQL-compatible and scales for large `GROUP BY` / `JOIN` workloads.
- **How:** Replicate or ETL relevant tables (e.g. citations, domain_visibility_score_history) to TiDB; point analytical API routes or workers to a second connection string. The codebase does not include TiDB-specific code; add a separate Drizzle config or raw MySQL client when you adopt this path.

---

## Cache / Queue: Upstash Redis

- **Use for:** Rate-limiting the AI Collector, optional job queue, or overlap discovery via Redis sets (`SINTER`) as in [DEPLOYMENT.md](../DEPLOYMENT.md#alternative-upstash-redis-for-overlap-sinter).
- **Setup:** Create a Redis database at [Upstash](https://upstash.com), copy `REDIS_URL` into your app. `GET /api/health` reports Redis status when `REDIS_URL` is set.

---

## File Storage: Cloudflare R2

- **Use for:** Storing raw AI responses (JSON) or exported Parquet (e.g. URL metrics history) to keep primary DB small. 10 GB free.
- **Reference:** [DEPLOYMENT.md](../DEPLOYMENT.md#storage-optimization-historical-url-metrics-duckdb--r2-parquet) describes exporting URL metrics to Parquet and uploading to R2. Add R2 upload in your ingest or export pipeline when you need it.

---

## Auth: Clerk or NextAuth

- **Use for:** User management, protected dashboard, API keys per tenant. Both offer free tiers.
- **Note:** `.env.example` includes `NEXTAUTH_SECRET`; add Clerk or NextAuth when you introduce multi-user or authenticated access.

---

## Quick reference

- **Minimal free setup:** Neon (`DATABASE_URL`) + Vercel (hosting). Optional: Upstash Redis (`REDIS_URL`) for rate-limiting or overlap.
- **When to add TiDB:** When analytical queries (competitors, visibility, trends) slow down on Neon.
- **When to add R2:** When you want to archive raw responses or long-term URL metrics outside Postgres.
