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
