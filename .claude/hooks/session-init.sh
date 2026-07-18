#!/bin/bash

# Claude session initialization hook
# Only runs in Claude Code web environment

if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 1

# Install dependencies if node_modules doesn't exist or is outdated
if [ ! -d "node_modules" ] || [ "pnpm-lock.yaml" -nt "node_modules" ]; then
  pnpm install --frozen-lockfile 2>&1
fi

# No fly access here, so seed from data/official instead of pulling prod.
export DATABASE_URL="file:db/dev.db"

if [ ! -f "db/dev.db" ]; then
  mkdir -p db
  touch db/dev.db
fi

pnpm run db:migrate 2>&1
pnpm run db:seed 2>&1
