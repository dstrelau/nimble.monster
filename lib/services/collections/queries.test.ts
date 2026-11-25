import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listPublicCollectionsForUser } from "@/lib/db/collection";
import { getDatabase } from "@/lib/db/drizzle";
import { getPublicLibraryCounts } from "@/lib/db/my-library";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import {
  getMonsteryMondayOverview,
  hasMonsteryMondayCollections,
  MONSTERY_MONDAY,
  searchPublicCollections,
} from "./queries";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const [curator, alice, bob, carol, dave] = [1, 2, 3, 4, 5].map(uuid);
const collectionId = uuid(100);

describe("searchPublicCollections contributors", () => {
  beforeEach(async () => {
    const client = createClient({ url: "file::memory:" });
    const db = drizzle(client, { schema: { ...schema, ...relations } });
    await migrate(db, { migrationsFolder: "migrations" });
    vi.mocked(getDatabase).mockReturnValue(db);

    await db.insert(schema.users).values(
      [curator, alice, bob, carol, dave].map((id, i) => ({
        id,
        discordId: `discord-${i}`,
        username: ["curator", "alice", "bob", "carol", "dave"][i],
      }))
    );
    await db.insert(schema.collections).values({
      id: collectionId,
      name: "Monstery Monday Week 1 - Test",
      creatorId: curator,
      visibility: "public",
      featuredCollection: MONSTERY_MONDAY,
    });
    const monster = (
      n: number,
      creatorId: string,
      visibility: "public" | "private" = "public"
    ) => ({
      id: uuid(200 + n),
      name: `Monster ${n}`,
      level: "1",
      levelInt: 1,
      hp: 10,
      armor: "" as const,
      creatorId,
      visibility,
    });
    await db
      .insert(schema.monsters)
      .values([
        monster(1, bob),
        monster(2, alice),
        monster(3, alice),
        monster(4, dave, "private"),
      ]);
    await db.insert(schema.items).values({
      id: uuid(300),
      name: "Item",
      creatorId: carol,
      visibility: "public",
    });
    await db.insert(schema.ancestries).values({
      id: uuid(400),
      name: "Ancestry",
      description: "",
      size: '["medium"]',
      creatorId: alice,
      visibility: "public",
    });
    await db.insert(schema.randomTables).values([
      { id: uuid(500), name: "Table", creatorId: bob, visibility: "public" },
      { id: uuid(501), name: "Secret", creatorId: dave, visibility: "private" },
    ]);
    await db.insert(schema.monstersCollections).values(
      [1, 2, 3, 4].map((n) => ({
        monsterId: uuid(200 + n),
        collectionId,
      }))
    );
    await db
      .insert(schema.itemsCollections)
      .values({ itemId: uuid(300), collectionId });
    await db
      .insert(schema.ancestriesCollections)
      .values({ ancestryId: uuid(400), collectionId });
    await db
      .insert(schema.randomTablesCollections)
      .values(
        [500, 501].map((n) => ({ randomTableId: uuid(n), collectionId }))
      );
  });

  it("lists creators of public entities, most contributions first", async () => {
    const params = {
      sortBy: "createdAt",
      sortDirection: "desc",
      limit: 10,
    } as const;
    const [featured] = await searchPublicCollections({
      ...params,
      featuredCollection: MONSTERY_MONDAY,
    });
    // Alice: 2 monsters + 1 ancestry; Bob: 1 monster + 1 reference table;
    // Carol: 1 item. Dave's monster and table are private and the curator
    // contributed nothing.
    const ids = featured.contributors?.map((u) => u.id);
    expect(ids).toEqual([alice, bob, carol]);

    const [unfeatured] = await searchPublicCollections(params);
    expect(unfeatured.contributors).toBeUndefined();
  });

  it("counts public reference tables in the Monstery Monday overview", async () => {
    const { counts } = await getMonsteryMondayOverview();
    expect(counts.randomTables).toBe(1);
    expect(counts.items).toBe(1);
    expect(counts.ancestries).toBe(1);
  });

  it("leaves Monstery Monday out of a creator's profile collections", async () => {
    await getDatabase()
      .insert(schema.collections)
      .values([
        {
          id: uuid(600),
          name: "Curator's Picks",
          creatorId: curator,
          visibility: "public",
        },
        {
          id: uuid(601),
          name: "Alice's Other Feature",
          creatorId: alice,
          visibility: "public",
          featuredCollection: "another feature",
        },
      ]);

    const curatorCollections = await listPublicCollectionsForUser(curator);
    expect(curatorCollections.map((c) => c.id)).toEqual([uuid(600)]);
    expect((await getPublicLibraryCounts(curator)).collections).toBe(1);
    expect(await hasMonsteryMondayCollections(curator)).toBe(true);

    // Other featured groups still show, and they do not earn the banner.
    const aliceCollections = await listPublicCollectionsForUser(alice);
    expect(aliceCollections.map((c) => c.id)).toEqual([uuid(601)]);
    expect(await hasMonsteryMondayCollections(alice)).toBe(false);
  });
});
