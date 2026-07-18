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

# There is no fly access in the web environment, so we can't pull the
# production database. Instead, seed a fresh dev database with the official
# content bundled in data/official (85 monsters, ancestries, classes, etc.).
# This means test monsters are always available without hand-crafting them.
export DATABASE_URL="file:db/dev.db"

if [ ! -f "db/dev.db" ]; then
  mkdir -p db
  touch db/dev.db
fi

# Migrate then seed. Both are idempotent, so this is safe on every session.
pnpm run db:migrate 2>&1
pnpm run db:seed 2>&1
