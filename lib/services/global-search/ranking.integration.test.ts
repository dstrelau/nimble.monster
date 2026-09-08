import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, describe, expect, it, vi } from "vitest";

const clientHolder = vi.hoisted((): { client: Client | null } => ({
  client: null,
}));

vi.mock("@/lib/db/client", () => ({
  getClient: () => {
    if (!clientHolder.client) throw new Error("Test client is not initialized");
    return clientHolder.client;
  },
}));

vi.mock("@/lib/rules/filesystem", () => ({
  getAllRules: () => [],
}));

vi.mock("@/lib/rules/faqs", () => ({
  getAllRuleFaqs: () => [],
  ruleFaqUrl: () => "/rules/test",
}));

import { searchGlobal } from "./repository";

const exactId = "00000000-0000-4000-8000-000000000001";
const prefixId = "00000000-0000-4000-8000-000000000002";
let temporaryDirectory: string | null = null;

afterEach(async () => {
  clientHolder.client?.close();
  clientHolder.client = null;
  if (temporaryDirectory) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    temporaryDirectory = null;
  }
});

describe("global search ranking", () => {
  it("applies exact-name ranking before limiting BM25 candidates", async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "nimble-ranking-"));
    clientHolder.client = createClient({
      url: `file:${join(temporaryDirectory, "test.db")}`,
    });
    await migrate(drizzle(clientHolder.client), {
      migrationsFolder: "migrations",
    });
    await clientHolder.client.execute({
      sql: "INSERT INTO users (id, username) VALUES (?, ?)",
      args: ["user-1", "search-owner"],
    });

    await clientHolder.client.batch([
      {
        sql: `
          INSERT INTO custom_rules
            (id, user_id, name, keywords, content, visibility)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [exactId, "user-1", "Frost", "", "A brief rule.", "public"],
      },
      {
        sql: `
          INSERT INTO custom_rules
            (id, user_id, name, keywords, content, visibility)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          prefixId,
          "user-1",
          "Frost Giant",
          "",
          "Another brief rule.",
          "public",
        ],
      },
      ...Array.from({ length: 20 }, (_, index) => ({
        sql: `
          INSERT INTO custom_rules
            (id, user_id, name, keywords, content, visibility)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          `00000000-0000-4000-8000-${String(index + 3).padStart(12, "0")}`,
          "user-1",
          `Document ${index}`,
          "",
          "frost ".repeat(100),
          "public",
        ],
      })),
    ]);

    const bm25Only = await clientHolder.client.execute({
      sql: `
        SELECT catalog.entity_id
        FROM global_search_fts
        INNER JOIN global_search_catalog AS catalog
          ON catalog.id = global_search_fts.rowid
        WHERE global_search_fts MATCH ?
        ORDER BY bm25(global_search_fts, 12.0, 5.0, 2.0, 1.0) ASC
        LIMIT 12
      `,
      args: ['"frost"*'],
    });
    expect(bm25Only.rows.map((row) => row.entity_id)).not.toContain(exactId);
    expect(bm25Only.rows.map((row) => row.entity_id)).not.toContain(prefixId);

    const results = await searchGlobal("frost", {
      types: ["rule"],
      limit: 12,
    });

    expect(results).toHaveLength(12);
    expect(results[0]).toMatchObject({ id: exactId, name: "Frost" });
    expect(results[1]).toMatchObject({ id: prefixId, name: "Frost Giant" });
  });
});
