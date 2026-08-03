#!/bin/sh
set -e

cd /app/backend

echo "[Entrypoint] Syncing database schema..."
npx prisma db push --accept-data-loss

echo "[Entrypoint] Starting application..."
exec node dist/main.js