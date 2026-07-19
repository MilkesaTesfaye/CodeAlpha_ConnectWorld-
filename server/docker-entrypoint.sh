#!/bin/sh
# ─── ConnectWorld Server Docker Entrypoint ──────────────────────────────────
# Runs before the main server process to ensure the database is ready.
# 1. Push Prisma schema to create/update database tables
# 2. Seed the database with roles, permissions, and sample users
# 3. Start the application server

set -e

echo "⏳ Waiting for database to be ready..."
# Wait for MySQL to accept connections (up to 30s)
MAX_RETRIES=30
RETRY_COUNT=0
until nc -z mysql 3306 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Database not available after ${MAX_RETRIES}s - continuing anyway..."
else
  echo "✅ Database is ready"
fi

echo "📦 Pushing Prisma schema..."
npx prisma db push --accept-data-loss --no-hints 2>&1 || echo "⚠️ Schema push had issues, continuing..."

echo "🌱 Seeding database..."
node dist/seed.js 2>&1 || echo "⚠️ Seed had issues, continuing..."
node dist/seed-users.js 2>&1 || echo "⚠️ User seed had issues, continuing..."

echo "🚀 Starting ConnectWorld Server..."
exec node dist/server.js
