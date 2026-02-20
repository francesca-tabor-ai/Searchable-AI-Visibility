import {
  pgTable,
  text,
  uuid,
  timestamp,
  unique,
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
export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  queryId: uuid("query_id")
    .notNull()
    .references(() => queries.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  rawText: text("raw_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Extracted citation (URL) from a response.
 * Unique per (response_id, normalized url) to avoid duplicates.
 */
export const citations = pgTable(
  "citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => responses.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    citationsResponseUrlUnique: unique("citations_response_url_unique").on(
      table.responseId,
      table.url
    ),
  })
);

export type Query = typeof queries.$inferSelect;
export type NewQuery = typeof queries.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
export type Citation = typeof citations.$inferSelect;
export type NewCitation = typeof citations.$inferInsert;
