# Searchable — AI Search Visibility

**Searchable** is an **AI citation tracking and visibility platform** that shows when and how often AI assistants (e.g. ChatGPT, Claude) cite your brand’s URLs in answers. It turns “are we in AI answers?” into a measurable, comparable metric you can improve.

---

## The problem

People ask AI tools for recommendations and decisions. If your site isn’t cited, you’re invisible in those answers. Until now there was no clear way to measure or benchmark that visibility.

## What Searchable does

- **Measures AI visibility** — The **Searchable Visibility Score™** (0–100) reflects how often your domain is cited by AI models for relevant queries. You get a single number, trend (e.g. +/− %), and a 30-day history so you can track progress.
- **Surfaces trends** — Compare your visibility over 7d, 30d, or 90d and see how you stack up vs. top competitors on the same queries.
- **Competitive benchmarking** — See who else gets cited for the same queries (overlap competitors), their share of voice, and a leaderboard. Use overlap heatmaps and query-level comparison to see where you win or lose.
- **Content attribution** — See which URLs drive citations: citation count, unique queries, average position in the answer, and “opportunity” pages (cited but ranked low). Identify top performers and pages to optimize or fix (e.g. redirects, 404s).
- **Ingest & normalize** — Ingest raw AI responses via API; the platform extracts and normalizes citations (inline links, numbered refs, plain URLs) and stores query, model, and domain so everything ties back to your score and reports.

---

## Who it’s for

- **Product and brand marketers** who care about being recommended by AI.
- **SEO and content teams** who want to optimize for AI citations, not only traditional search.
- **Competitive / insights teams** who need to compare their brand’s AI visibility to competitors.

---

## Positioning

Searchable is **“AI search visibility”** — the place to measure, benchmark, and improve how often AI models cite your brand. It’s built as a serious, data-first SaaS: dark UI, clear metrics, and every insight paired with an action (e.g. “Optimize this page”, “View queries”, “Refresh”). Calm, confident, and built for teams that treat AI answers as a channel worth measuring and optimizing.

---

## Populate data (empty dashboard / “No domains with visibility data”)

If the dashboard, **Visibility trends**, Competitive Analysis, or Content performance shows **“No domains with visibility data”** or **“Ingest some citations first”**, run these in order from the project root (with `DATABASE_URL` in `.env.local`):

```bash
# 1. Seed queries, responses, citations, visibility scores, and competitor_metrics
npm run db:seed

# 2. Populate URL-level metrics (required for Content performance / URL leaderboard)
npm run script:url-metrics
```

Then refresh the app. **competitor_metrics** is now populated by `db:seed`; use `script:competitors-refresh` only to refresh after adding data via ingest. To fill **competitor_metrics** (Visibility trends “top 2 competitors”, competitor leaderboard), run:

```bash
npm run script:competitors-refresh
```

(Or call `POST /api/competitors/refresh` with optional `{"domain":"nike.com"}` when the app is running.)

---

Other ways to add data:

### Option A: Seed sample data (fastest)

Run the two commands in the **Populate data** section above: `npm run db:seed` then `npm run script:url-metrics`. That fills visibility scores, trends, leaderboard, and URL metrics.

### Option B: Compute visibility scores from existing citations

If you already have citations (e.g. from `/api/ingest`) but no scores:

```bash
npm run worker:visibility-score:once
```

This computes the Searchable Visibility Score™ per domain and fills the visibility tables.

### Option C: Ingest via API

Send real AI responses to the ingest API so the app extracts citations and stores them:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"query":"best running shoes","model":"gpt-4","rawResponseText":"See [Nike](https://www.nike.com/running) and 1. https://adidas.com/run"}'
```

Then run `npm run worker:visibility-score:once` to compute scores, or wait for the scheduled cron.

For **"Missing domain"** errors and citation/data issues, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
