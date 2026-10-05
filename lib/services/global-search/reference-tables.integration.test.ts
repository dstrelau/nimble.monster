import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { afterEach, expect, it, vi } from "vitest";

const holder = vi.hoisted((): { client: Client | null } => ({ client: null }));
vi.mock("@/lib/db/client", () => ({
  getClient: () => {
    if (!holder.client) throw new Error("Test client is not initialized");
    return holder.client;
  },
}));
vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: () => {
    if (!holder.client) throw new Error("Test client is not initialized");
    return drizzle(holder.client);
  },
}));
vi.mock("@/lib/rules/filesystem", () => ({ getAllRules: () => [] }));
vi.mock("@/lib/rules/faqs", () => ({
  getAllRuleFaqs: () => [],
  ruleFaqUrl: () => "/rules/test",
}));

import { getRandomTableCounts } from "@/lib/db/random-table";
import journal from "@/migrations/meta/_journal.json";
import { listRecentGlobal, searchGlobal } from "./repository";

let directory: string | null = null;
afterEach(async () => {
  holder.client?.close();
  holder.client = null;
  if (directory) await rm(directory, { recursive: true, force: true });
  directory = null;
});

it("backfills public tables and synchronizes search, recent results, and counts", async () => {
  directory = await mkdtemp(join(tmpdir(), "nimble-table-search-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  holder.client = client;
  const migrations = readMigrationFiles({ migrationsFolder: "migrations" });
  const tableSearchEntry = journal.entries.find(
    (entry) => entry.tag === "0037_reference_table_search"
  );
  const tableSearchIndex = migrations.findIndex(
    (migration) => migration.folderMillis === tableSearchEntry?.when
  );
  if (tableSearchIndex < 0) throw new Error("Missing table search migration");
  for (const migration of migrations.slice(0, tableSearchIndex)) {
    await client.executeMultiple(migration.sql.join("\n"));
  }
  await client.execute(
    "INSERT INTO users (id, username) VALUES ('owner', 'table-owner')"
  );
  const id = "00000000-0000-4000-8000-000000000001";
  await client.batch([
    {
      sql: "INSERT INTO random_tables (id, user_id, name, description, visibility) VALUES (?, 'owner', 'Armor & Defense', 'Protective equipment', 'public')",
      args: [id],
    },
    {
      sql: "INSERT INTO random_tables (id, user_id, name, description, visibility) VALUES ('private', 'owner', 'Armor Secrets', 'Protective secrets', 'private')",
      args: [],
    },
  ]);
  expect(
    (
      await client.execute(
        "SELECT entity_id FROM global_search_catalog WHERE entity_type = 'randomTable'"
      )
    ).rows
  ).toEqual([]);
  for (const migration of migrations.slice(tableSearchIndex)) {
    await client.executeMultiple(migration.sql.join("\n"));
  }

  expect(await getRandomTableCounts()).toEqual({ randomTables: 1 });
  expect(await searchGlobal("armor")).toEqual([
    expect.objectContaining({
      type: "randomTable",
      id,
      name: "Armor & Defense",
      href: "/random-tables/armor-defense-00000000008008000000000001",
      creator: { id: "owner", name: "table-owner", username: "table-owner" },
    }),
  ]);
  expect(await searchGlobal("protective", { types: ["randomTable"] })).toEqual([
    expect.objectContaining({ id, matchedField: "summary" }),
  ]);
  expect(await searchGlobal("armor", { types: ["item"] })).toEqual([]);
  expect(await listRecentGlobal("randomTable")).toEqual([
    expect.objectContaining({ id }),
  ]);

  const newId = "00000000-0000-4000-8000-000000000002";
  await client.execute({
    sql: "INSERT INTO random_tables (id, user_id, name, description) VALUES (?, 'owner', 'Weapons', 'Martial gear')",
    args: [newId],
  });
  expect(await searchGlobal("martial")).toEqual([
    expect.objectContaining({ id: newId }),
  ]);
  expect(await getRandomTableCounts()).toEqual({ randomTables: 2 });
  await client.execute({
    sql: "UPDATE random_tables SET name = 'Updated Equipment', description = 'Travel supplies' WHERE id = ?",
    args: [id],
  });
  expect(await searchGlobal("armor")).toEqual([]);
  expect(await searchGlobal("protective")).toEqual([]);
  expect(await searchGlobal("travel")).toEqual([
    expect.objectContaining({ id, name: "Updated Equipment" }),
  ]);
  await client.execute({
    sql: "UPDATE random_tables SET visibility = 'private' WHERE id = ?",
    args: [id],
  });
  expect(await searchGlobal("travel")).toEqual([]);
  expect(await listRecentGlobal("randomTable")).toEqual([
    expect.objectContaining({ id: newId }),
  ]);
  expect(await getRandomTableCounts()).toEqual({ randomTables: 1 });
  await client.execute({
    sql: "UPDATE random_tables SET visibility = 'public' WHERE id = ?",
    args: [id],
  });
  expect(await searchGlobal("travel")).toHaveLength(1);
  await client.execute({
    sql: "DELETE FROM random_tables WHERE id = ?",
    args: [id],
  });
  expect(await searchGlobal("travel")).toEqual([]);
});
