import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import {
  addRandomTableToCollection,
  createCollection,
  getCollection,
  getPublicCollectionByIdWithMonstersItems,
  listCollectionsWithMonstersForUser,
  updateCollection,
} from "./collection";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

let client: Client;
let directory: string;
const ownerId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const tableIds = {
  pub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ownPrivate: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  foreignPrivate: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
};

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "collection-tables-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
  await db.insert(schema.users).values([
    { id: ownerId, username: "owner", discordId: "owner" },
    { id: otherId, username: "other", discordId: "other" },
  ]);
  await db.insert(schema.randomTables).values([
    { id: tableIds.pub, creatorId: otherId, name: "Pub", visibility: "public" },
    {
      id: tableIds.ownPrivate,
      creatorId: ownerId,
      name: "Mine",
      visibility: "private",
    },
    {
      id: tableIds.foreignPrivate,
      creatorId: otherId,
      name: "Theirs",
      visibility: "private",
    },
  ]);
});

afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

describe("collection reference tables", () => {
  it("links accessible tables only and hides private ones from public views", async () => {
    const created = await createCollection({
      name: "C",
      visibility: "public",
      discordId: "owner",
    });
    await updateCollection({
      id: created.id,
      name: "C",
      visibility: "public",
      discordId: "owner",
      randomTableIds: Object.values(tableIds),
    });

    expect(
      (await getCollection(created.id, "owner"))?.randomTables
        .map((t) => t.name)
        .sort()
    ).toEqual(["Mine", "Pub"]);
    expect(
      (await listCollectionsWithMonstersForUser("owner"))
        .find((c) => c.id === created.id)
        ?.randomTables.map((t) => t.name)
    ).toEqual(["Mine", "Pub"]);
    expect(
      (
        await getPublicCollectionByIdWithMonstersItems(created.id)
      )?.randomTables.map((t) => t.name)
    ).toEqual(["Pub"]);

    await updateCollection({
      id: created.id,
      name: "C",
      visibility: "public",
      discordId: "owner",
      randomTableIds: [],
    });
    expect((await getCollection(created.id, "owner"))?.randomTables).toEqual(
      []
    );
  });

  it("adds a single table idempotently", async () => {
    const created = await createCollection({
      name: "C",
      visibility: "public",
      discordId: "owner",
    });
    const input = { randomTableId: tableIds.pub, collectionId: created.id };
    await addRandomTableToCollection(input);
    await addRandomTableToCollection(input);
    expect(
      (await getCollection(created.id, "owner"))?.randomTables.map((t) => t.id)
    ).toEqual([tableIds.pub]);
  });
});
