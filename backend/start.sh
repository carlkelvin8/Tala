#!/bin/bash
set -e

echo "Starting NSTP Backend..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Check if JWT secrets are set
if [ -z "$JWT_ACCESS_SECRET" ]; then
  echo "WARNING: JWT_ACCESS_SECRET not set, using default (not recommended for production)"
fi

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the server
echo "Starting server on port ${PORT:-3000}..."
node dist/server.js
