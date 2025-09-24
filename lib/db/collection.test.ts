import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Collection, Monster, User } from "@/lib/prisma";
import { getCollection } from "./collection";
import { prisma } from "./index";

describe("Collection access control", () => {
  let publicCollection: Collection;
  let privateCollection: Collection;
  let publicMonster: Monster;
  let privateMonster: Monster;
  let testUser: User;
  let otherUser: User;
  let testRunId: string;

  beforeEach(async () => {
    // Use unique identifiers for each test run
    testRunId = Date.now().toString();

    // Create test users
    testUser = await prisma.user.create({
      data: {
        discordId: `test-user-discord-id-${testRunId}`,
        username: `testuser-${testRunId}`,
        displayName: "Test User",
      },
    });

    otherUser = await prisma.user.create({
      data: {
        discordId: `other-user-discord-id-${testRunId}`,
        username: `otheruser-${testRunId}`,
        displayName: "Other User",
      },
    });

    // Create test monsters with different visibility
    publicMonster = await prisma.monster.create({
      data: {
        name: "Public Monster",
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

    privateMonster = await prisma.monster.create({
      data: {
        name: "Private Monster",
        level: "2",
        levelInt: 2,
        hp: 20,
        armor: "heavy",
        actions: [],
        abilities: [],
        saves: [],
        userId: testUser.id,
        visibility: "private",
      },
    });

    // Create public collection
    publicCollection = await prisma.collection.create({
      data: {
        name: "Public Collection",
        visibility: "public",
        creatorId: testUser.id,
      },
    });

    // Create private collection
    privateCollection = await prisma.collection.create({
      data: {
        name: "Private Collection",
        visibility: "private",
        creatorId: testUser.id,
      },
    });

    // Add both monsters to both collections
    await prisma.monsterInCollection.createMany({
      data: [
        { collectionId: publicCollection.id, monsterId: publicMonster.id },
        { collectionId: publicCollection.id, monsterId: privateMonster.id },
        { collectionId: privateCollection.id, monsterId: publicMonster.id },
        { collectionId: privateCollection.id, monsterId: privateMonster.id },
      ],
    });
  });

  afterEach(async () => {
    // Clean up test data in correct order to avoid foreign key constraints
    await prisma.monsterInCollection.deleteMany({
      where: {
        OR: [
          { collectionId: publicCollection?.id },
          { collectionId: privateCollection?.id },
        ],
      },
    });
    await prisma.itemInCollection.deleteMany({
      where: {
        OR: [
          { collectionId: publicCollection?.id },
          { collectionId: privateCollection?.id },
        ],
      },
    });
    await prisma.collection.deleteMany({
      where: {
        creatorId: testUser?.id,
      },
    });
    await prisma.monster.deleteMany({
      where: {
        userId: testUser?.id,
      },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [{ id: testUser?.id }, { id: otherUser?.id }],
      },
    });
  });

  it("should not show private monsters in public collections to non-owners", async () => {
    // Non-owner (otherUser) viewing public collection
    const collection = await getCollection(
      publicCollection.id,
      otherUser.discordId
    );

    expect(collection).toBeTruthy();
    expect(collection?.visibility).toBe("public");

    // Should only show public monsters when accessed by non-owners
    const monsterNames = collection?.monsters.map((m) => m.name);
    expect(monsterNames).toContain("Public Monster");
    expect(monsterNames).not.toContain("Private Monster");
  });

  it("should show all monsters in public collections to owners", async () => {
    // Owner (testUser) viewing their own public collection
    const collection = await getCollection(
      publicCollection.id,
      testUser.discordId
    );

    expect(collection).toBeTruthy();
    expect(collection?.visibility).toBe("public");

    // Should show all monsters to the owner
    const monsterNames = collection?.monsters.map((m) => m.name);
    expect(monsterNames).toContain("Public Monster");
    expect(monsterNames).toContain("Private Monster");
  });

  it("should show all monsters in private collections to owners", async () => {
    // Owner viewing their private collection
    const collection = await getCollection(
      privateCollection.id,
      testUser.discordId
    );

    expect(collection).toBeTruthy();
    expect(collection?.visibility).toBe("private");

    // Private collections should show all monsters to the owner
    const monsterNames = collection?.monsters.map((m) => m.name);
    expect(monsterNames).toContain("Public Monster");
    expect(monsterNames).toContain("Private Monster");
  });

  it("should filter private monsters from private collections for non-owners", async () => {
    // Non-owner viewing private collection (this should normally be blocked at page level,
    // but if somehow accessed, should still filter private monsters)
    const collection = await getCollection(
      privateCollection.id,
      otherUser.discordId
    );

    expect(collection).toBeTruthy();
    expect(collection?.visibility).toBe("private");

    // Should only show public monsters even in private collections if accessed by non-owners
    const monsterNames = collection?.monsters.map((m) => m.name);
    expect(monsterNames).toContain("Public Monster");
    expect(monsterNames).not.toContain("Private Monster");
  });
});
