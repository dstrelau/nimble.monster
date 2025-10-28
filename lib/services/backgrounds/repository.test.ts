import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import type { User } from "@/lib/prisma";
import { paginatePublicBackgrounds } from "./repository";

describe("Background pagination", () => {
  let testUser: User;
  let testRunId: string;

  beforeEach(async () => {
    testRunId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    testUser = await prisma.user.create({
      data: {
        discordId: `test-user-${testRunId}`,
        username: `testuser-${testRunId}`,
        displayName: "Test User",
      },
    });

    await prisma.background.createMany({
      data: [
        {
          name: "Soldier",
          description: "You have served in an army",
          userId: testUser.id,
        },
        {
          name: "Criminal",
          description: "You have a history of breaking the law",
          userId: testUser.id,
        },
        {
          name: "Folk Hero",
          description: "You come from humble origins",
          userId: testUser.id,
        },
        {
          name: "City Watch",
          description: "You served as a city guard",
          userId: testUser.id,
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.background.deleteMany({ where: { userId: testUser?.id } });
    await prisma.user.deleteMany({ where: { id: testUser?.id } });
  });

  it("should paginate without search", async () => {
    const result = await paginatePublicBackgrounds({
      limit: 2,
      sort: "name",
      creatorId: testUser.id,
    });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe("City Watch");
    expect(result.data[1].name).toBe("Criminal");
    expect(result.nextCursor).toBeTruthy();
  });

  it("should paginate with search", async () => {
    const result = await paginatePublicBackgrounds({
      limit: 10,
      sort: "name",
      search: "Criminal",
      creatorId: testUser.id,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("Criminal");
  });

  it("should paginate with cursor", async () => {
    const firstPage = await paginatePublicBackgrounds({
      limit: 2,
      sort: "name",
      creatorId: testUser.id,
    });

    expect(firstPage.nextCursor).toBeTruthy();
    const cursor = firstPage.nextCursor ?? "";

    const secondPage = await paginatePublicBackgrounds({
      limit: 2,
      sort: "name",
      cursor,
      creatorId: testUser.id,
    });

    expect(secondPage.data).toHaveLength(2);
    expect(secondPage.data[0].name).toBe("Folk Hero");
    expect(secondPage.data[1].name).toBe("Soldier");
  });

  it("should paginate with search and cursor", async () => {
    const firstPage = await paginatePublicBackgrounds({
      limit: 1,
      sort: "name",
      search: "i",
      creatorId: testUser.id,
    });

    expect(firstPage.data).toHaveLength(1);
    expect(firstPage.data[0].name).toBe("City Watch");
    expect(firstPage.nextCursor).toBeTruthy();
    const cursor = firstPage.nextCursor ?? "";

    const secondPage = await paginatePublicBackgrounds({
      limit: 1,
      sort: "name",
      search: "i",
      cursor,
      creatorId: testUser.id,
    });

    expect(secondPage.data).toHaveLength(1);
    expect(secondPage.data[0].name).toBe("Criminal");
  });

  it("should handle descending sort with search and cursor", async () => {
    const firstPage = await paginatePublicBackgrounds({
      limit: 1,
      sort: "-name",
      search: "o",
      creatorId: testUser.id,
    });

    expect(firstPage.data).toHaveLength(1);
    expect(firstPage.data[0].name).toBe("Soldier");
    expect(firstPage.nextCursor).toBeTruthy();
    const cursor = firstPage.nextCursor ?? "";

    const secondPage = await paginatePublicBackgrounds({
      limit: 1,
      sort: "-name",
      search: "o",
      cursor,
      creatorId: testUser.id,
    });

    expect(secondPage.data).toHaveLength(1);
    expect(secondPage.data[0].name).toBe("Folk Hero");
  });

  it("should sort by createdAt with search", async () => {
    const result = await paginatePublicBackgrounds({
      limit: 10,
      sort: "-createdAt",
      search: "o",
      creatorId: testUser.id,
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.map((b) => b.name)).toContain("Soldier");
    expect(result.data.map((b) => b.name)).toContain("Folk Hero");
  });

  it("should return empty when no results match search", async () => {
    const result = await paginatePublicBackgrounds({
      limit: 10,
      sort: "name",
      search: "Wizard",
      creatorId: testUser.id,
    });

    expect(result.data).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });
});
