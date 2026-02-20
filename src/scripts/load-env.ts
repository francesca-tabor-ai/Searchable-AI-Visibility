/**
 * Load .env and .env.local before any other imports that need DATABASE_URL.
 * Import this first in scripts (e.g. seed.ts) so process.env is set before db is loaded.
 * Run from project root: npm run db:seed
 */
import "dotenv/config";
import { config } from "dotenv";
import path from "path";

const root = path.resolve(process.cwd());
config({ path: path.join(root, ".env") });
config({ path: path.join(root, ".env.local"), override: true });
