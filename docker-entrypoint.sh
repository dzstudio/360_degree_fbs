#!/bin/sh
set -e

# Run database migrations
npx prisma migrate deploy

# Start the application
exec node dist/main.js