import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const clientHolder = vi.hoisted((): { client: Client | null } => ({
  client: null,
}));

vi.mock("@/lib/db/client", () => ({
  getClient: () => {
    if (!clientHolder.client) throw new Error("Test client is not initialized");
    return clientHolder.client;
  },
}));

import { listMyLibraryEntries } from "./my-library";

const M1 = "00000000-0000-4000-8000-000000000001";
const H1 = "00000000-0000-4000-8000-000000000002";
const R1 = "00000000-0000-4000-8000-000000000004";
const C1 = "00000000-0000-4000-8000-000000000005";
const T1 = "00000000-0000-4000-8000-000000000006";

let temporaryDirectory: string | null = null;

beforeEach(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "nimble-my-library-"));
  clientHolder.client = createClient({
    url: `file:${join(temporaryDirectory, "test.db")}`,
  });
  await migrate(drizzle(clientHolder.client), {
    migrationsFolder: "migrations",
  });
  await clientHolder.client.batch([
    "INSERT INTO users (id, username) VALUES ('owner', 'owner'), ('other', 'other')",
    `INSERT INTO monsters (id, user_id, name, level, hp, armor, hazard, visibility, created_at, paperforge_id) VALUES
      ('00000000-0000-4000-8000-000000000001', 'owner', 'Goblin', '1', 5, 'none', 0, 'private', '2026-01-03 00:00:00', 'pf-goblin'),
      ('00000000-0000-4000-8000-000000000002', 'owner', 'Pit Trap', '1', 5, 'none', 1, 'public', '2026-01-05 00:00:00', NULL),
      ('00000000-0000-4000-8000-000000000003', 'other', 'Other Goblin', '1', 5, 'none', 0, 'public', '2026-01-09 00:00:00', NULL)`,
    `INSERT INTO items (id, user_id, name, image_icon, created_at) VALUES
      ('00000000-0000-4000-8000-000000000007', 'owner', 'Sword', 'broadsword', '2025-12-01 00:00:00')`,
    `INSERT INTO custom_rules (id, user_id, name, created_at) VALUES
      ('00000000-0000-4000-8000-000000000004', 'owner', '100% Goblin Rules', '2026-01-04 00:00:00')`,
    `INSERT INTO conditions (id, name, description, creator_id, created_at) VALUES
      ('00000000-0000-4000-8000-000000000005', 'Goblinoid', 'Gross', 'owner', '2026-01-01 00:00:00')`,
    `INSERT INTO random_tables (id, user_id, name, created_at) VALUES
      ('00000000-0000-4000-8000-000000000006', 'owner', 'Loot', '2026-01-02 00:00:00')`,
  ]);
});

afterEach(async () => {
  clientHolder.client?.close();
  clientHolder.client = null;
  if (temporaryDirectory) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    temporaryDirectory = null;
  }
});

describe("listMyLibraryEntries", () => {
  it("lists only the owner's entries across types, newest first", async () => {
    const entries = await listMyLibraryEntries("owner", { limit: 4 });

    expect(entries).toEqual([
      {
        key: "hazards",
        id: H1,
        name: "Pit Trap",
        href: expect.stringMatching(/^\/hazards\//),
        visibility: "public",
        createdAt: "2026-01-05T00:00:00Z",
      },
      expect.objectContaining({ key: "rules", id: R1 }),
      expect.objectContaining({
        key: "monsters",
        id: M1,
        visibility: "private",
        paperforgeId: "pf-goblin",
      }),
      expect.objectContaining({ key: "random-tables", id: T1 }),
    ]);
  });

  it("filters by name case-insensitively, treating LIKE wildcards literally", async () => {
    const goblins = await listMyLibraryEntries("owner", { query: "gOBLIN" });
    expect(goblins.map((entry) => entry.id)).toEqual([R1, M1, C1]);
    expect(goblins[2]).not.toHaveProperty("visibility");

    const [sword] = await listMyLibraryEntries("owner", { query: "sword" });
    expect(sword).toMatchObject({ key: "items", imageIcon: "broadsword" });
    expect(sword).not.toHaveProperty("paperforgeId");

    const percent = await listMyLibraryEntries("owner", { query: "%" });
    expect(percent.map((entry) => entry.id)).toEqual([R1]);
  });
});
