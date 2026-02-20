-- Materialized view for fast competitor leaderboard reads.
-- Run once after competitor_metrics table exists: psql $DATABASE_URL -f scripts/create-competitor-leaderboard-mv.sql
-- Refresh daily (e.g. after competitor refresh): REFRESH MATERIALIZED VIEW CONCURRENTLY competitor_leaderboard;

CREATE MATERIALIZED VIEW IF NOT EXISTS competitor_leaderboard AS
SELECT
  target_domain,
  competitor_domain,
  overlap_score,
  shared_queries,
  total_queries_target,
  competitor_visibility_score,
  competitor_rank,
  share_of_voice,
  computed_at
FROM competitor_metrics;

CREATE UNIQUE INDEX IF NOT EXISTS competitor_leaderboard_target_competitor_idx
  ON competitor_leaderboard (target_domain, competitor_domain);

CREATE INDEX IF NOT EXISTS competitor_leaderboard_target_domain_idx
  ON competitor_leaderboard (target_domain);

-- After first creation, use REFRESH MATERIALIZED VIEW CONCURRENTLY competitor_leaderboard;
-- (CONCURRENTLY requires the unique index above.)
