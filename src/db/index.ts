import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type NodeDb = ReturnType<typeof drizzle<typeof schema>>;
let _db: NodeDb | null = null;

function getDb(): NodeDb {
  if (!_db) {
    const raw = process.env.DATABASE_URL;
    if (!raw) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const connectionString = raw.trim();
    if (!connectionString.startsWith("postgresql://") && !connectionString.startsWith("postgres://")) {
      throw new Error(
        'DATABASE_URL must start with postgresql:// or postgres://. Check .env.local for spaces or a missing protocol.'
      );
    }
    try {
      new URL(connectionString);
    } catch {
      throw new Error(
        "DATABASE_URL is not a valid URL. Remove any trailing spaces/newlines in .env.local and ensure special characters in the password are percent-encoded (e.g. @ → %40)."
      );
    }
    _db = drizzle(
      new Pool({
        connectionString,
        // Railway's public proxy cert may be self-signed; allow when connecting from local
        ssl: { rejectUnauthorized: false },
      }),
      { schema }
    );
  }
  return _db;
}

/** Lazy-initialized so build (e.g. Vercel) can run without DATABASE_URL. */
export const db = new Proxy({} as NodeDb, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
export { schema };
