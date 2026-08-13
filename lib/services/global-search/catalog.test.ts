import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, describe, expect, it } from "vitest";

let client: Client | null = null;
let temporaryDirectory: string | null = null;

async function catalogNames(): Promise<string[]> {
  if (!client) throw new Error("Migration test client is not initialized");

  const result = await client.execute({
    sql: "SELECT name FROM global_search_catalog WHERE entity_type = ?",
    args: ["rule"],
  });
  return result.rows.map((row) => String(row.name));
}

async function ftsNames(query: string): Promise<string[]> {
  if (!client) throw new Error("Migration test client is not initialized");

  const result = await client.execute({
    sql: `
      SELECT catalog.name
      FROM global_search_fts
      INNER JOIN global_search_catalog AS catalog
        ON catalog.id = global_search_fts.rowid
      WHERE global_search_fts MATCH ?
    `,
    args: [`${query}*`],
  });
  return result.rows.map((row) => String(row.name));
}

afterEach(async () => {
  client?.close();
  client = null;
  if (temporaryDirectory) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    temporaryDirectory = null;
  }
});

describe("global search catalog migration", () => {
  it("synchronizes custom rule create, update, visibility, and delete", async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "nimble-global-search-"));
    client = createClient({
      url: `file:${join(temporaryDirectory, "test.db")}`,
    });
    await migrate(drizzle(client), { migrationsFolder: "migrations" });

    await client.execute({
      sql: "INSERT INTO users (id, username) VALUES (?, ?)",
      args: ["user-1", "search-owner"],
    });
    await client.execute({
      sql: `
        INSERT INTO custom_rules
          (id, user_id, name, keywords, content, visibility)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        "rule-1",
        "user-1",
        "Ancient rule",
        "ward",
        "An ancient ward",
        "public",
      ],
    });

    expect(await catalogNames()).toEqual(["Ancient rule"]);
    expect(await ftsNames("ancient")).toEqual(["Ancient rule"]);

    await client.execute({
      sql: "UPDATE custom_rules SET name = ?, content = ? WHERE id = ?",
      args: ["Updated rule", "A frost ward", "rule-1"],
    });
    expect(await catalogNames()).toEqual(["Updated rule"]);
    expect(await ftsNames("ancient")).toEqual([]);
    expect(await ftsNames("frost")).toEqual(["Updated rule"]);

    await client.execute({
      sql: "UPDATE custom_rules SET visibility = ? WHERE id = ?",
      args: ["private", "rule-1"],
    });
    expect(await catalogNames()).toEqual([]);

    await client.execute({
      sql: "UPDATE custom_rules SET visibility = ? WHERE id = ?",
      args: ["public", "rule-1"],
    });
    expect(await catalogNames()).toEqual(["Updated rule"]);

    await client.execute({
      sql: "DELETE FROM custom_rules WHERE id = ?",
      args: ["rule-1"],
    });
    expect(await catalogNames()).toEqual([]);
    expect(await ftsNames("frost")).toEqual([]);
  });
});
