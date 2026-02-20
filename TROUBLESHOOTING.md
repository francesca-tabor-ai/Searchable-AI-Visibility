# Troubleshooting

## "Missing domain" (Trends or data)

A **"Missing domain"** message can appear in two situations:

### 1. Trends page: no domain in the request

When viewing **Visibility trends**, the chart needs a target domain. If you see "Missing domain":

- **Select a domain** from the overview dropdown, or
- Open the trends page with a domain in the URL: `/dashboard/trends?domain=yourdomain.com`

The API requires the `domain` query parameter; without it, the response has no domain and the UI shows this error.

### 2. Citations without an associated domain (data issue)

Sometimes citations extracted from AI responses don’t get an associated domain. This can happen if:

- URLs in the raw response are **malformed** (e.g. truncated, invalid scheme, or not parseable)
- There was an error during **citation extraction** (e.g. the parser couldn’t normalize the URL to a domain)

In this codebase, the ingest pipeline **skips** malformed URLs (they are not stored), so every stored citation has a domain. If you still see missing-domain issues in reports or downstream data:

1. **Ingest more data**  
   Use `POST /api/ingest` with additional raw AI response text so more valid citations are captured:

   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -H "Content-Type: application/json" \
     -d '{"query":"your query","model":"model-name","rawResponseText":"..."}'
   ```

2. **Run the visibility-score worker**  
   Ensure the visibility-score worker has run so the latest visibility scores and metrics are computed:

   ```bash
   npm run worker:visibility-score:once
   ```

3. **Check raw data**  
   Inspect the raw AI response text for malformed or incomplete URLs (e.g. broken links, placeholders, or non-http(s) URIs). Fix or exclude those before ingesting if possible.

If problems persist, verify that `DATABASE_URL` and any cron/worker configuration are correct, and that the ingest and worker processes can reach the database.
