import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type NodeDb = ReturnType<typeof drizzle<typeof schema>>;
let _db: NodeDb | null = null;

function getDb(): NodeDb {
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
export const db = new Proxy({} as NodeDb, {
  get(_, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
export { schema };
