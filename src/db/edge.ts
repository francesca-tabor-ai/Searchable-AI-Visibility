/**
 * Edge-compatible DB client for Vercel Edge Runtime.
 * Uses Neon serverless driver; requires DATABASE_URL to be a Neon or
 * Vercel Postgres connection string.
 * Lazy-initialized so build (e.g. Vercel) can run without DATABASE_URL.
 */
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    _db = drizzle(connectionString, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return (getDb() as Record<string | symbol, unknown>)[prop];
  },
});
export { schema };
