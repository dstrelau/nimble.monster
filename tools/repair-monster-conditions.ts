#!/usr/bin/env node

// Build with pnpm run conditions:repair:bundle; production ships the same bundle.
// DATABASE_URL=file:/path/to/database.sqlite node tmp/repair-monster-conditions.mjs
// Add --apply to repair links; without it this only reports proposed changes.
import { checkpoint, getClient } from "@/lib/db/client";
import { repairMonsterConditions } from "@/lib/services/monsters/conditions";

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== "--apply")) {
  throw new Error("Usage: node repair-monster-conditions.mjs [--apply]");
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const apply = args[0] === "--apply";
try {
  const result = await repairMonsterConditions(apply);
  if (apply) await checkpoint();
  process.stdout.write(`${JSON.stringify({ apply, ...result })}\n`);
} finally {
  getClient().close();
}
