/**
 * Edge-compatible DB client for Vercel Edge Runtime.
 * Uses Neon serverless driver; requires DATABASE_URL to be a Neon or
 * Vercel Postgres connection string.
 */
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = drizzle(connectionString, { schema });
export { schema };
