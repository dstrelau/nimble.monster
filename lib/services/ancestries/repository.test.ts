import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { findPublicAncestry } from "@/app/actions/ancestry";
import {
  getAwardBySlugWithCounts,
  getAwardsWithCounts,
  getEntitiesForAward,
} from "@/lib/db/award";
import {
  getCollectionOverviewByIdWithMonstersItems,
  listCollectionsWithMonstersForUser,
} from "@/lib/db/collection";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { findPublicCollectionById } from "@/lib/services/collections/repository";
import {
  createAncestry,
  deleteAncestry,
  findAncestriesByIds,
  findAncestry,
  findAncestryWithCreatorId,
  listPublicAncestries,
  paginatePublicAncestries,
  searchPublicAncestries,
  updateAncestry,
} from "./repository";
import type { CreateAncestryInput } from "./types";

const mockAuth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const ownerId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const publicId = "33333333-3333-4333-8333-333333333333";
const privateId = "44444444-4444-4444-8444-444444444444";
const otherPrivateId = "55555555-5555-4555-8555-555555555555";
const input: CreateAncestryInput = {
  name: "New ancestry",
  description: "Description",
  size: ["small", "medium"],
  rarity: "uncommon",
  abilities: [{ name: "Ability", description: "Ability description" }],
};

const signIn = (id = ownerId, discordId = "owner-discord") => {
  mockAuth.mockResolvedValue({
    user: {
      id,
      discordId,
      username: "owner",
      displayName: "Owner",
      imageUrl: "",
    },
    expires: "2099-01-01",
  });
};

describe("ancestry visibility", () => {
  let client: Client;

  beforeEach(async () => {
    client = createClient({ url: "file::memory:" });
    const db = drizzle(client, { schema: { ...schema, ...relations } });
    await migrate(db, { migrationsFolder: "migrations" });
    vi.mocked(getDatabase).mockReturnValue(db);
    mockAuth.mockResolvedValue(null);
    await db.insert(schema.users).values([
      { id: ownerId, discordId: "owner-discord", username: "owner" },
      { id: otherId, discordId: "other-discord", username: "other" },
    ]);
    await db.insert(schema.ancestries).values([
      { ...input, id: publicId, userId: ownerId, size: '["medium"]' },
      {
        ...input,
        id: privateId,
        name: "Owner private",
        userId: ownerId,
        size: '["small"]',
        visibility: "private",
      },
      {
        ...input,
        id: otherPrivateId,
        name: "Other private",
        userId: otherId,
        size: '["large"]',
        visibility: "private",
      },
    ]);
  });

  afterEach(() => {
    client.close();
    vi.clearAllMocks();
  });

  it("preserves the database public default for existing ancestries", async () => {
    expect(await findAncestry(publicId)).toMatchObject({
      visibility: "public",
    });
  });

  it("excludes private ancestries from every public list, including creator searches", async () => {
    signIn();
    expect((await listPublicAncestries()).map((a) => a.id)).toEqual([publicId]);
    expect(
      (await searchPublicAncestries({ creatorId: "owner-discord" })).map(
        (a) => a.id
      )
    ).toEqual([publicId]);
    expect(
      (
        await paginatePublicAncestries({
          sort: "name",
          limit: 10,
          creatorId: ownerId,
        })
      ).data.map((a) => a.id)
    ).toEqual([publicId]);
  });

  it("shows both visibilities in My Library without accepting another creator ID", async () => {
    signIn();
    const result = await paginatePublicAncestries(
      {
        sort: "name",
        limit: 1,
        creatorId: otherId,
      },
      true
    );
    expect(result.data.map((a) => a.id)).toEqual([publicId]);
    expect(result.nextCursor).not.toBeNull();
    const next = await paginatePublicAncestries(
      {
        sort: "name",
        limit: 1,
        cursor: result.nextCursor ?? undefined,
      },
      true
    );
    expect(next.data.map((a) => a.id)).toEqual([privateId]);
    mockAuth.mockResolvedValue(null);
    await expect(
      paginatePublicAncestries({ sort: "name", limit: 10 }, true)
    ).rejects.toThrow("Unauthorized");
  });

  it("hides private details and bulk references from anonymous users and non-owners", async () => {
    for (const viewer of [null, otherId]) {
      if (viewer) signIn(viewer, "other-discord");
      else mockAuth.mockResolvedValue(null);
      expect(await findAncestry(privateId)).toBeNull();
      expect(await findAncestryWithCreatorId(privateId, ownerId)).toBeNull();
      expect(
        (await findAncestriesByIds([privateId, publicId])).map((a) => a.id)
      ).toEqual([publicId]);
    }
    signIn();
    expect(await findAncestry(privateId)).toMatchObject({
      id: privateId,
      visibility: "private",
    });
    expect(
      (await findAncestriesByIds([privateId, publicId, otherPrivateId])).map(
        (a) => a.id
      )
    ).toEqual([privateId, publicId]);
  });

  it("never returns private data from the explicitly public server action, even to its owner", async () => {
    signIn();
    expect(await findPublicAncestry(privateId)).toMatchObject({
      success: false,
      ancestry: null,
    });
    expect(await findPublicAncestry(publicId)).toMatchObject({
      success: true,
      ancestry: { id: publicId },
    });
  });

  it("omits private children from the public collection API data source, even for its owner", async () => {
    signIn();
    const db = getDatabase();
    const collectionId = "66666666-6666-4666-8666-666666666666";
    await db.insert(schema.collections).values({
      id: collectionId,
      creatorId: ownerId,
      name: "Public collection",
      visibility: "public",
    });
    await db.insert(schema.ancestriesCollections).values(
      [publicId, privateId, otherPrivateId].map((ancestryId) => ({
        collectionId,
        ancestryId,
      }))
    );
    const collection = await findPublicCollectionById(collectionId);
    expect(collection?.ancestries.map((a) => a.id)).toEqual([publicId]);
    const overview = await getCollectionOverviewByIdWithMonstersItems(
      collectionId,
      "owner-discord"
    );
    expect(overview?.ancestries.map((a) => a.id)).toEqual([
      publicId,
      privateId,
    ]);
    const ownCollections =
      await listCollectionsWithMonstersForUser("owner-discord");
    expect(ownCollections[0].ancestries.map((a) => a.id)).toEqual([
      publicId,
      privateId,
    ]);
  });

  it("omits private ancestries from public awards and their counts", async () => {
    signIn();
    const db = getDatabase();
    const awardId = "77777777-7777-4777-8777-777777777777";
    await db.insert(schema.awards).values({
      id: awardId,
      name: "Award",
      abbreviation: "AW",
      slug: "award",
      url: "https://example.com",
      color: "blue",
      icon: "star",
    });
    await db.insert(schema.ancestriesAwards).values(
      [publicId, privateId, otherPrivateId].map((ancestryId) => ({
        awardId,
        ancestryId,
      }))
    );
    expect(
      (await getEntitiesForAward(awardId)).ancestries.map((a) => a.id)
    ).toEqual([publicId]);
    expect((await getAwardBySlugWithCounts("award"))?.ancestryCount).toBe(1);
    expect((await getAwardsWithCounts())[0].ancestryCount).toBe(1);
  });

  it("persists both toggle directions and preserves privacy when older callers omit visibility", async () => {
    signIn();
    const created = await createAncestry(
      { ...input, visibility: "private" },
      "owner-discord"
    );
    expect(created.visibility).toBe("private");
    expect(
      (await updateAncestry(created.id, input, "owner-discord")).visibility
    ).toBe("private");
    expect(
      (
        await updateAncestry(
          created.id,
          { ...input, visibility: "public" },
          "owner-discord"
        )
      ).visibility
    ).toBe("public");
    expect(
      (
        await updateAncestry(
          created.id,
          { ...input, visibility: "private" },
          "owner-discord"
        )
      ).visibility
    ).toBe("private");
    expect((await createAncestry(input, "owner-discord")).visibility).toBe(
      "public"
    );
  });

  it("rejects forged ownership and invalid visibility at the server boundary", async () => {
    signIn(otherId, "other-discord");
    await expect(
      updateAncestry(privateId, input, "owner-discord")
    ).rejects.toThrow("Unauthorized");
    await expect(
      updateAncestry(privateId, input, "other-discord")
    ).rejects.toThrow("not owned");
    expect(await deleteAncestry(privateId, "owner-discord")).toBe(false);
    signIn();
    await expect(
      // @ts-expect-error Runtime requests can bypass TypeScript.
      createAncestry({ ...input, visibility: "secret" }, "owner-discord")
    ).rejects.toThrow();
  });
});
