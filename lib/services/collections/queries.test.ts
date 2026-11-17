import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { MONSTERY_MONDAY, searchPublicCollections } from "./queries";

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
    // Alice: 2 monsters + 1 ancestry; Bob and Carol tie at 1 each. Dave's
    // monster is private and the curator contributed nothing.
    const ids = featured.contributors?.map((u) => u.id);
    expect(ids?.[0]).toBe(alice);
    expect(ids?.slice(1).sort()).toEqual([bob, carol].sort());

    const [unfeatured] = await searchPublicCollections(params);
    expect(unfeatured.contributors).toBeUndefined();
  });
});
