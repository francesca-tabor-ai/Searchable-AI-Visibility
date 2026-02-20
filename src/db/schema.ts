import {
  pgTable,
  text,
  uuid,
  timestamp,
  unique,
  doublePrecision,
  index,
  integer,
} from "drizzle-orm/pg-core";

/**
 * User query that triggered an AI response.
 * Stored once per distinct query; responses reference this.
 */
export const queries = pgTable(
  "queries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ queriesTextUnique: unique("queries_text_unique").on(table.text) })
);

/**
 * A single AI model response (raw text) for a given query.
 */
export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    queryId: uuid("query_id")
      .notNull()
      .references(() => queries.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    rawText: text("raw_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ responsesQueryIdIdx: index("responses_query_id_idx").on(table.queryId) })
);

/**
 * Extracted citation (URL) from a response.
 * Unique per (response_id, normalized url) to avoid duplicates.
 * query_id is denormalized from responses for fast (domain, query_id) index on overlap queries.
 */
export const citations = pgTable(
  "citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    queryId: uuid("query_id").references(() => queries.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    citationsResponseUrlUnique: unique("citations_response_url_unique").on(
      table.responseId,
      table.url
    ),
    citationsDomainIdx: index("citations_domain_idx").on(table.domain),
    citationsDomainQueryIdx: index("idx_citations_domain_query").on(table.domain, table.queryId),
  })
);

/**
 * Searchable Visibility Score™ per domain (computed daily).
 * score and change stored as float; previous_score is the prior run's score for trend.
 */
export const domainVisibilityScores = pgTable("domain_visibility_scores", {
  domain: text("domain").primaryKey(),
  score: doublePrecision("score").notNull(),
  previousScore: doublePrecision("previous_score"),
  change: doublePrecision("change"),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Append-only history for sparklines (one row per domain per cron run).
 */
export const domainVisibilityScoreHistory = pgTable("domain_visibility_score_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: text("domain").notNull(),
  score: doublePrecision("score").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Pre-aggregated competitor metrics for fast dashboard access.
 * overlap_score = shared_queries / total_queries_for_target.
 * competitor_rank = RANK() by visibility_score among overlap domains.
 */
export const competitorMetrics = pgTable(
  "competitor_metrics",
  {
    targetDomain: text("target_domain").notNull(),
    competitorDomain: text("competitor_domain").notNull(),
    overlapScore: doublePrecision("overlap_score").notNull(),
    sharedQueries: integer("shared_queries").notNull(),
    totalQueriesTarget: integer("total_queries_target").notNull(),
    competitorVisibilityScore: doublePrecision("competitor_visibility_score"),
    competitorRank: doublePrecision("competitor_rank"),
    shareOfVoice: doublePrecision("share_of_voice"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    competitorMetricsTargetCompetitor: unique("competitor_metrics_target_competitor").on(
      table.targetDomain,
      table.competitorDomain
    ),
    competitorMetricsTargetDomainIdx: index("competitor_metrics_target_domain_idx").on(
      table.targetDomain
    ),
  })
);

export type Query = typeof queries.$inferSelect;
export type NewQuery = typeof queries.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
export type Citation = typeof citations.$inferSelect;
export type NewCitation = typeof citations.$inferInsert;
export type DomainVisibilityScore = typeof domainVisibilityScores.$inferSelect;
export type NewDomainVisibilityScore = typeof domainVisibilityScores.$inferInsert;
export type DomainVisibilityScoreHistory = typeof domainVisibilityScoreHistory.$inferSelect;
export type NewDomainVisibilityScoreHistory = typeof domainVisibilityScoreHistory.$inferInsert;
/**
 * URL-level performance metrics (content attribution).
 * Populated by aggregation script; citation_count, unique_query_count, avg_position, last_cited_at per normalized URL.
 * High-cardinality: B-tree index on (domain, citation_count) for list/leaderboard queries.
 */
export const urlPerformanceMetrics = pgTable(
  "url_performance_metrics",
  {
    normalizedUrl: text("normalized_url").primaryKey(),
    domain: text("domain").notNull(),
    citationCount: integer("citation_count").notNull().default(0),
    uniqueQueryCount: integer("unique_query_count").notNull().default(0),
    avgPosition: doublePrecision("avg_position"),
    lastCitedAt: timestamp("last_cited_at", { withTimezone: true }),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    urlPerformanceMetricsDomainIdx: index("url_performance_metrics_domain_idx").on(table.domain),
    urlPerformanceMetricsDomainCitationIdx: index("url_performance_metrics_domain_citation_idx").on(
      table.domain,
      table.citationCount
    ),
  })
);

/**
 * Optional: canonical URL mapping for redirects / duplicate content.
 * from_url -> to_url (canonical). Used to group or flag URLs that cite the same content.
 */
export const urlCanonicalMapping = pgTable("url_canonical_mapping", {
  fromUrl: text("from_url").primaryKey(),
  toUrl: text("to_url").notNull(),
});

/**
 * Result of pinging a URL (Railway worker). Used to detect 404s / decaying content on top-cited URLs.
 */
export const urlHealthCheck = pgTable("url_health_check", {
  normalizedUrl: text("normalized_url").primaryKey(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }).notNull().defaultNow(),
  statusCode: integer("status_code"),
  isOk: integer("is_ok").notNull(), // 1 = ok (2xx/3xx), 0 = error (4xx/5xx/timeout)
});

export type CompetitorMetric = typeof competitorMetrics.$inferSelect;
export type NewCompetitorMetric = typeof competitorMetrics.$inferInsert;
export type UrlPerformanceMetric = typeof urlPerformanceMetrics.$inferSelect;
export type NewUrlPerformanceMetric = typeof urlPerformanceMetrics.$inferInsert;
export type UrlCanonicalMapping = typeof urlCanonicalMapping.$inferSelect;
export type NewUrlCanonicalMapping = typeof urlCanonicalMapping.$inferInsert;
export type UrlHealthCheck = typeof urlHealthCheck.$inferSelect;
export type NewUrlHealthCheck = typeof urlHealthCheck.$inferInsert;
