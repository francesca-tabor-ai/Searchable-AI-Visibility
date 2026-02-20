#!/usr/bin/env bash
# Production deploy: run Drizzle schema push (migrations) then build.
# Use on Railway or any host that has DATABASE_URL set.
# Usage: ./deploy.sh   or   bash deploy.sh

set -e

echo "[deploy] Running schema push (Drizzle)..."
npm run db:push:pg || {
  echo "[deploy] db:push failed (missing DATABASE_URL?). Skipping and continuing with build."
}

echo "[deploy] Building..."
npm run build

echo "[deploy] Done."
