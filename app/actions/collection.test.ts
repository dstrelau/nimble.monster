import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import type { Collection, Item, Monster, User } from "@/lib/prisma";
import { addItemToCollection, addMonsterToCollection } from "./collection";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/navigation", () => ({
  unauthorized: vi.fn(() => ({ error: "Unauthorized" })),
  forbidden: vi.fn(() => ({ error: "Forbidden" })),
}));

const { auth } = await import("@/lib/auth");
const { unauthorized, forbidden } = await import("next/navigation");

describe("Collection actions", () => {
  let testUser: User;
  let otherUser: User;
  let collection: Collection;
  let item: Item;
  let monster: Monster;
  let testRunId: string;

  beforeEach(async () => {
    testRunId = Date.now().toString();

    testUser = await prisma.user.create({
      data: {
        discordId: `test-user-${testRunId}`,
        username: `testuser-${testRunId}`,
        displayName: "Test User",
      },
    });

    otherUser = await prisma.user.create({
      data: {
        discordId: `other-user-${testRunId}`,
        username: `otheruser-${testRunId}`,
        displayName: "Other User",
      },
    });

    collection = await prisma.collection.create({
      data: {
        name: "Test Collection",
        visibility: "public",
        creatorId: testUser.id,
      },
    });

    item = await prisma.item.create({
      data: {
        name: "Test Item",
        userId: testUser.id,
        visibility: "public",
      },
    });

    monster = await prisma.monster.create({
      data: {
        name: "Test Monster",
        level: "1",
        levelInt: 1,
        hp: 10,
        armor: "medium",
        actions: [],
        abilities: [],
        saves: [],
        userId: testUser.id,
        visibility: "public",
      },
    });
  });

  afterEach(async () => {
    await prisma.itemInCollection.deleteMany({
      where: { collectionId: collection?.id },
    });
    await prisma.monsterInCollection.deleteMany({
      where: { collectionId: collection?.id },
    });
    await prisma.collection.deleteMany({
      where: { creatorId: testUser?.id },
    });
    await prisma.item.deleteMany({
      where: { userId: testUser?.id },
    });
    await prisma.monster.deleteMany({
      where: { userId: testUser?.id },
    });
    await prisma.user.deleteMany({
      where: { OR: [{ id: testUser?.id }, { id: otherUser?.id }] },
    });
    vi.clearAllMocks();
  });

  describe("addItemToCollection", () => {
    it("should add item to collection successfully", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: testUser.id, discordId: testUser.discordId },
      });

      const formData = new FormData();
      formData.append("itemId", item.id);
      formData.append("collectionId", collection.id);

      const result = await addItemToCollection(formData);

      expect(result).toEqual({ success: true });

      const itemInCollection = await prisma.itemInCollection.findFirst({
        where: {
          itemId: item.id,
          collectionId: collection.id,
        },
      });
      expect(itemInCollection).toBeTruthy();
    });

    it("should return unauthorized when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const formData = new FormData();
      formData.append("itemId", item.id);
      formData.append("collectionId", collection.id);

      const _result = await addItemToCollection(formData);

      expect(unauthorized).toHaveBeenCalled();
    });

    it("should return error when itemId is missing", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: testUser.id, discordId: testUser.discordId },
      });

      const formData = new FormData();
      formData.append("collectionId", collection.id);

      const result = await addItemToCollection(formData);

      expect(result).toEqual({
        success: false,
        error: "Missing itemId or collectionId",
      });
    });

    it("should return error when collectionId is missing", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: testUser.id, discordId: testUser.discordId },
      });

      const formData = new FormData();
      formData.append("itemId", item.id);

      const result = await addItemToCollection(formData);

      expect(result).toEqual({
        success: false,
        error: "Missing itemId or collectionId",
      });
    });

    it("should return forbidden when user is not collection owner", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: otherUser.id, discordId: otherUser.discordId },
      });

      const formData = new FormData();
      formData.append("itemId", item.id);
      formData.append("collectionId", collection.id);

      const _result = await addItemToCollection(formData);

      expect(forbidden).toHaveBeenCalled();
    });

    it("should return error when collection does not exist", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: testUser.id, discordId: testUser.discordId },
      });

      const formData = new FormData();
      formData.append("itemId", item.id);
      formData.append("collectionId", "non-existent-id");

      const result = await addItemToCollection(formData);

      expect(result).toEqual({
        success: false,
        error: "Collection not found or you don't have permission to update it",
      });
    });
  });

  describe("addMonsterToCollection", () => {
    it("should add monster to collection successfully", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: testUser.id, discordId: testUser.discordId },
      });

      const formData = new FormData();
      formData.append("monsterId", monster.id);
      formData.append("collectionId", collection.id);

      const result = await addMonsterToCollection(formData);

      expect(result).toEqual({ success: true });

      const monsterInCollection = await prisma.monsterInCollection.findFirst({
        where: {
          monsterId: monster.id,
          collectionId: collection.id,
        },
      });
      expect(monsterInCollection).toBeTruthy();
    });
  });
});
