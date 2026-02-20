-- Top Performers: query this view with ORDER BY citation_count DESC.
-- Opportunity: URLs cited but with avg_position > 3 (low rank); query with ORDER BY citation_count DESC, avg_position DESC.
-- Run after url_performance_metrics exists: psql $DATABASE_URL -f scripts/create-url-views.sql

CREATE OR REPLACE VIEW top_performers AS
SELECT
  normalized_url,
  domain,
  citation_count,
  unique_query_count,
  avg_position,
  computed_at
FROM url_performance_metrics;

CREATE OR REPLACE VIEW opportunity_urls AS
SELECT
  normalized_url,
  domain,
  citation_count,
  unique_query_count,
  avg_position,
  computed_at
FROM url_performance_metrics
WHERE avg_position > 3
  AND avg_position IS NOT NULL;
