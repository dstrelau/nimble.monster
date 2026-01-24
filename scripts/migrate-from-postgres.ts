#!/usr/bin/env npx tsx

/**
 * Postgres → SQLite (libsql/Turso) migration script
 *
 * Usage:
 *   POSTGRES_URL=postgres://... DATABASE_URL=file:dev.db npx tsx scripts/migrate-from-postgres.ts
 *
 * Options:
 *   --yes, -y   Skip confirmation prompt
 */

import * as fs from "node:fs";
import * as readline from "node:readline";
import { createClient, type InValue } from "@libsql/client";
import { Pool } from "pg";

const args = process.argv.slice(2);
const skipConfirm = args.includes("--yes") || args.includes("-y");

async function confirm(message: string): Promise<boolean> {
  if (skipConfirm) return true;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

// Tables to migrate in order (respecting foreign key dependencies)
const MIGRATION_ORDER = [
  "users",
  "sources",
  "awards",
  "families",
  "monsters",
  "companions",
  "items",
  "spell_schools",
  "spells",
  "subclasses",
  "backgrounds",
  "ancestries",
  "collections",
  "conditions",
  // Join tables
  "monsters_families",
  "monsters_collections",
  "monsters_conditions",
  "monsters_awards",
  "items_collections",
  "items_awards",
  "spell_schools_collections",
  "spell_schools_awards",
  "companions_awards",
  "subclasses_awards",
  "subclass_abilities",
  "backgrounds_awards",
  "ancestries_awards",
  // Other tables
  // "entity_images",
];

// Column mappings from Postgres to SQLite (only where names differ)
const COLUMN_MAPPINGS: Record<string, Record<string, string>> = {
  collections: { user_id: "user_id" },
  families: { user_id: "user_id" },
  conditions: { creator_id: "creator_id" },
};

// Columns to skip (exist in Postgres but not SQLite)
const COLUMNS_TO_SKIP: Record<string, Set<string>> = {
  users: new Set(["refresh_token"]),
};

// Default values for NOT NULL fields that may be NULL in Postgres
const DEFAULT_VALUES: Record<string, Record<string, unknown>> = {
  monsters: {
    saves: "",
    bloodied: "",
    last_stand: "",
    kind: "",
    more_info: "",
  },
  users: {
    name: "",
  },
};

function transformRow(
  table: string,
  row: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...row };

  // Apply default values for NULL fields
  const defaults = DEFAULT_VALUES[table];
  if (defaults) {
    for (const [field, defaultValue] of Object.entries(defaults)) {
      if (result[field] === null || result[field] === undefined) {
        result[field] = defaultValue;
      }
    }
  }

  // Convert Postgres JSON arrays to JSON strings
  const jsonArrayFields: Record<string, string[]> = {
    monsters: ["actions", "abilities"],
    companions: ["actions", "abilities"],
    families: ["abilities"],
    ancestries: ["abilities"],
  };

  if (jsonArrayFields[table]) {
    for (const field of jsonArrayFields[table]) {
      if (result[field] !== null && result[field] !== undefined) {
        if (typeof result[field] !== "string") {
          result[field] = JSON.stringify(result[field]);
        }
      }
    }
  }

  // Convert string arrays to single string (take first or empty)
  const stringArrayFields: Record<string, string[]> = {
    monsters: ["saves"],
  };

  if (stringArrayFields[table]) {
    for (const field of stringArrayFields[table]) {
      if (Array.isArray(result[field])) {
        result[field] = (result[field] as string[])[0] || "";
      }
    }
  }

  // Convert string arrays to JSON strings for size field
  const jsonStringArrayFields: Record<string, string[]> = {
    ancestries: ["size"],
  };

  if (jsonStringArrayFields[table]) {
    for (const field of jsonStringArrayFields[table]) {
      const value = result[field];
      if (Array.isArray(value)) {
        result[field] = JSON.stringify(value);
      } else if (
        typeof value === "string" &&
        value.startsWith("{") &&
        value.endsWith("}")
      ) {
        // Parse Postgres array format: {item1,item2} -> ["item1","item2"]
        const items = value.slice(1, -1).split(",").filter(Boolean);
        result[field] = JSON.stringify(items);
      }
    }
  }

  // Convert timestamps to ISO strings
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Date) {
      result[key] = value.toISOString();
    }
  }

  // Apply column mappings
  const mappings = COLUMN_MAPPINGS[table];
  if (mappings) {
    for (const [from, to] of Object.entries(mappings)) {
      if (from !== to && result[from] !== undefined) {
        result[to] = result[from];
        delete result[from];
      }
    }
  }

  return result;
}

function sortMonstersByDependency(
  monsters: Record<string, unknown>[]
): Record<string, unknown>[] {
  const monsterMap = new Map<string, Record<string, unknown>>();
  const sorted: Record<string, unknown>[] = [];
  const visited = new Set<string>();

  for (const monster of monsters) {
    monsterMap.set(monster.id as string, monster);
  }

  function visit(monster: Record<string, unknown>) {
    const id = monster.id as string;
    if (visited.has(id)) return;
    visited.add(id);

    const remixedFromId = monster.remixed_from_id;
    if (remixedFromId && remixedFromId !== null) {
      const parent = monsterMap.get(remixedFromId as string);
      if (parent) {
        visit(parent);
      }
    }

    sorted.push(monster);
  }

  for (const monster of monsters) {
    visit(monster);
  }

  return sorted;
}

const BATCH_SIZE = 100;

async function main() {
  const postgresUrl = process.env.POSTGRES_URL;
  const sqliteUrl = process.env.DATABASE_URL;

  if (!postgresUrl) {
    console.error("POSTGRES_URL environment variable is required");
    process.exit(1);
  }

  if (!sqliteUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("Connecting to Postgres...");
  const pgPool = new Pool({
    connectionString: postgresUrl,
    ssl: process.env.CA_CERT_PATH
      ? {
          ca: fs.readFileSync(process.env.CA_CERT_PATH, "utf8"),
          rejectUnauthorized: false,
        }
      : undefined,
  });

  console.log("Connecting to SQLite...");
  const sqlite = createClient({
    url: sqliteUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    await pgPool.query("SELECT 1");
    console.log("✓ Postgres connected");

    await sqlite.execute("SELECT 1");
    console.log("✓ SQLite connected");

    console.log(`\nTarget: ${sqliteUrl}`);

    const confirmed = await confirm(
      "This will DELETE all existing data in the SQLite database. Continue?"
    );
    if (!confirmed) {
      console.log("Migration cancelled.");
      process.exit(0);
    }

    // Disable foreign key checks
    await sqlite.execute("PRAGMA foreign_keys = OFF");

    // Clear existing data
    console.log("\nClearing existing SQLite data...");
    for (const table of [...MIGRATION_ORDER].reverse()) {
      try {
        await sqlite.execute(`DELETE FROM ${table}`);
      } catch {
        // Table might not exist
      }
    }

    // Migrate each table
    let totalMigrated = 0;
    for (const table of MIGRATION_ORDER) {
      try {
        const count = await migrateTable(pgPool, sqlite, table);
        totalMigrated += count;
      } catch (error) {
        console.error(`Failed to migrate ${table}:`, error);
      }
    }

    // Re-enable foreign key checks
    await sqlite.execute("PRAGMA foreign_keys = ON");

    console.log(
      `\n✓ Migration complete. Total rows migrated: ${totalMigrated}`
    );
  } finally {
    await pgPool.end();
    sqlite.close();
  }
}

async function migrateTable(
  pgPool: Pool,
  sqlite: ReturnType<typeof createClient>,
  table: string
): Promise<number> {
  console.log(`\nMigrating ${table}...`);

  const result = await pgPool.query(`SELECT * FROM ${table}`);
  let rows: Record<string, unknown>[] = result.rows;

  if (rows.length === 0) {
    console.log(`  No rows to migrate`);
    return 0;
  }

  if (table === "monsters") {
    rows = sortMonstersByDependency(rows);
  }

  console.log(`  Found ${rows.length} rows`);

  const skipCols = COLUMNS_TO_SKIP[table] || new Set<string>();
  const transformedRows = rows.map((row) => {
    const transformed = transformRow(table, row);
    // Filter out skipped columns
    skipCols.forEach((col) => {
      delete transformed[col];
    });
    return transformed;
  });

  let migrated = 0;
  let errors = 0;

  for (let i = 0; i < transformedRows.length; i += BATCH_SIZE) {
    const batch = transformedRows.slice(i, i + BATCH_SIZE);
    try {
      await insertBatch(sqlite, table, batch);
      migrated += batch.length;
      console.log(`  Progress: ${migrated}/${rows.length}`);
    } catch {
      // Fall back to individual inserts
      for (const row of batch) {
        try {
          await insertBatch(sqlite, table, [row]);
          migrated++;
        } catch (rowError) {
          errors++;
          if (errors <= 5) {
            console.error(`  Error migrating row:`, rowError);
            console.error(
              `  Row data:`,
              JSON.stringify(row, null, 2).slice(0, 500)
            );
          }
        }
      }
    }
  }

  console.log(`  Migrated ${migrated}/${rows.length} rows (${errors} errors)`);
  return migrated;
}

async function insertBatch(
  sqlite: ReturnType<typeof createClient>,
  table: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const columnList = columns.join(", ");
  const placeholders = columns.map(() => "?").join(", ");

  for (const row of rows) {
    const values: InValue[] = columns.map((col) => {
      const v = row[col];
      if (v === null || v === undefined) return null;
      if (typeof v === "boolean") return v ? 1 : 0;
      if (typeof v === "number") return v;
      if (typeof v === "string") return v;
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    });

    await sqlite.execute({
      sql: `INSERT OR IGNORE INTO ${table} (${columnList}) VALUES (${placeholders})`,
      args: values,
    });
  }
}

main().catch(console.error);
