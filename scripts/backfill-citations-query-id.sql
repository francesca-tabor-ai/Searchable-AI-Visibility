-- Backfill citations.query_id from responses (so idx_citations_domain_query is effective).
-- Run once after adding the query_id column: psql $DATABASE_URL -f scripts/backfill-citations-query-id.sql

UPDATE citations c
SET query_id = r.query_id
FROM responses r
WHERE c.response_id = r.id
  AND c.query_id IS NULL;

-- Optional: make query_id NOT NULL after backfill (then update schema to match).
-- ALTER TABLE citations ALTER COLUMN query_id SET NOT NULL;
