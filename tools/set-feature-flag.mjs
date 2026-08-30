#!/usr/bin/env node

import { createClient } from "@libsql/client";

const usage = `Usage: set-feature-flag <username> <feature> <true|false>

Features: class-draft-autosave, random-tables`;

const [username, feature, enabledValue, ...extraArgs] = process.argv.slice(2);
if (
  !username ||
  !["class-draft-autosave", "random-tables"].includes(feature) ||
  !["true", "false"].includes(enabledValue) ||
  extraArgs.length > 0
) {
  throw new Error(usage);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required in production");
}

const client = createClient({ url: databaseUrl ?? "file:db/dev.db" });

try {
  const result = await client.execute({
    sql: "SELECT id FROM users WHERE username = ? LIMIT 1",
    args: [username],
  });
  const userId = result.rows[0]?.id;
  if (typeof userId !== "string") throw new Error(`User not found: ${username}`);

  const enabled = enabledValue === "true";
  await client.execute({
    sql: `INSERT INTO user_feature_flags (user_id, feature, enabled)
      VALUES (?, ?, ?)
      ON CONFLICT (user_id, feature) DO UPDATE SET
        enabled = excluded.enabled,
        updated_at = CURRENT_TIMESTAMP`,
    args: [userId, feature, enabled],
  });

  process.stdout.write(
    `${feature} is now ${enabled ? "enabled" : "disabled"} for ${username}\n`
  );
} finally {
  client.close();
}
