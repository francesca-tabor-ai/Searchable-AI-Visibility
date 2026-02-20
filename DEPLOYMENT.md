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
