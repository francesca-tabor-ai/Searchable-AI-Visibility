import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    _db = drizzle(new Pool({ connectionString }), { schema });
  }
  return _db;
}

/** Lazy-initialized so build (e.g. Vercel) can run without DATABASE_URL. */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return (getDb() as Record<string | symbol, unknown>)[prop];
  },
});
export { schema };
