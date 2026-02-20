# Vercel Deployment — Searchable Dashboard

Deploy the Searchable dashboard and API to Vercel with Edge ingest, cron, and analytics.

## Quick deploy

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Set **Environment Variables** (see below).
3. Deploy. Every **PR gets a preview deployment** automatically when Vercel is connected to GitHub.

## Environment variables

Configure these in **Vercel → Project → Settings → Environment Variables** (apply to Production, Preview, and Development as needed).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use **Neon** or **Vercel Postgres** so `/api/ingest` (Edge) can connect. Example: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require` |
| `CRON_SECRET` | Recommended | Secret for securing `/api/cron/daily`. Generate with `openssl rand -hex 32`. Vercel sends it as `Authorization: Bearer <CRON_SECRET>` when invoking the cron. |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Optional | For future AI provider features; set if your dashboard or ingest pipeline will call external APIs. |

- **Preview deployments:** Use the same variables or override per branch (e.g. a separate Neon branch DB) in Vercel.
- **Edge runtime:** `/api/ingest` runs on the Edge and requires a **Neon or Vercel Postgres** `DATABASE_URL` (serverless driver). Other routes use the Node runtime and work with any Postgres URL.

## Optimizations in this repo

- **Edge Runtime for `/api/ingest`** — Ingest runs on the Edge to reduce latency; uses `@neondatabase/serverless` and Drizzle Neon serverless driver.
- **Vercel Cron** — Daily job at **06:00 UTC** calling `GET /api/cron/daily` (summary of counts). Extend this route for cleanup or reporting. Secure with `CRON_SECRET`.
- **Analytics** — `@vercel/analytics` is included in the root layout for performance and usage metrics in the Vercel dashboard.

## CI/CD and previews

- **Every PR** gets a **preview deployment** when the project is connected to GitHub (Vercel default).
- Preview URLs are available in the PR checks and in the Vercel dashboard.
- Use **Vercel → Analytics** to track Web Vitals and traffic for the dashboard.

## First-time database setup

After the first deploy, ensure the database has the schema. Run once (with the same `DATABASE_URL` as in Vercel):

```bash
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

Or use a one-off script / GitHub Action that runs `npm run db:push` with the production or preview `DATABASE_URL`.

## Cron schedule

The default schedule in `vercel.json` is:

- **Path:** `/api/cron/daily`
- **Schedule:** `0 6 * * *` (6:00 AM UTC daily)

Change the schedule in `vercel.json` if needed; redeploy to apply.
