import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import type { User } from "@/lib/prisma";
import { paginatePublicAncestries } from "./repository";

describe("Ancestry pagination", () => {
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

    await prisma.ancestry.createMany({
      data: [
        {
          name: "Elf",
          description: "Graceful and long-lived",
          size: ["medium"],
          abilities: [{ name: "Darkvision", description: "See in the dark" }],
          userId: testUser.id,
        },
        {
          name: "Dwarf",
          description: "Short and sturdy",
          size: ["medium"],
          abilities: [
            { name: "Stonecunning", description: "Know about stone" },
          ],
          userId: testUser.id,
        },
        {
          name: "Half-Elf",
          description: "Mixed heritage",
          size: ["medium"],
          abilities: [{ name: "Versatile", description: "Adaptable" }],
          userId: testUser.id,
        },
        {
          name: "Wood Elf",
          description: "Forest dwelling elf",
          size: ["medium"],
          abilities: [{ name: "Fleet of Foot", description: "Fast movement" }],
          userId: testUser.id,
        },
      ],
    });
  });

  afterEach(async () => {
    await prisma.ancestry.deleteMany({ where: { userId: testUser?.id } });
    await prisma.user.deleteMany({ where: { id: testUser?.id } });
  });

  it("should paginate without search", async () => {
    const result = await paginatePublicAncestries({
      limit: 2,
      sort: "name",
      creatorId: testUser.id,
    });

    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe("Dwarf");
    expect(result.data[1].name).toBe("Elf");
    expect(result.nextCursor).toBeTruthy();
  });

  it("should paginate with search", async () => {
    const result = await paginatePublicAncestries({
      limit: 10,
      sort: "name",
      search: "Elf",
      creatorId: testUser.id,
    });

    expect(result.data).toHaveLength(3);
    expect(result.data.map((a) => a.name)).toEqual([
      "Elf",
      "Half-Elf",
      "Wood Elf",
    ]);
  });

  it("should paginate with cursor", async () => {
    const firstPage = await paginatePublicAncestries({
      limit: 2,
      sort: "name",
      creatorId: testUser.id,
    });

    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await paginatePublicAncestries({
      limit: 2,
      sort: "name",
      cursor: firstPage.nextCursor!,
      creatorId: testUser.id,
    });

    expect(secondPage.data).toHaveLength(2);
    expect(secondPage.data[0].name).toBe("Half-Elf");
    expect(secondPage.data[1].name).toBe("Wood Elf");
  });

  it("should paginate with search and cursor", async () => {
    const firstPage = await paginatePublicAncestries({
      limit: 1,
      sort: "name",
      search: "Elf",
      creatorId: testUser.id,
    });

    expect(firstPage.data).toHaveLength(1);
    expect(firstPage.data[0].name).toBe("Elf");
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await paginatePublicAncestries({
      limit: 1,
      sort: "name",
      search: "Elf",
      cursor: firstPage.nextCursor!,
      creatorId: testUser.id,
    });

    expect(secondPage.data).toHaveLength(1);
    expect(secondPage.data[0].name).toBe("Half-Elf");
  });

  it("should handle descending sort with search and cursor", async () => {
    const firstPage = await paginatePublicAncestries({
      limit: 1,
      sort: "-name",
      search: "Elf",
      creatorId: testUser.id,
    });

    expect(firstPage.data).toHaveLength(1);
    expect(firstPage.data[0].name).toBe("Wood Elf");
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await paginatePublicAncestries({
      limit: 1,
      sort: "-name",
      search: "Elf",
      cursor: firstPage.nextCursor!,
      creatorId: testUser.id,
    });

    expect(secondPage.data).toHaveLength(1);
    expect(secondPage.data[0].name).toBe("Half-Elf");
  });

  it("should sort by createdAt with search", async () => {
    const result = await paginatePublicAncestries({
      limit: 10,
      sort: "-createdAt",
      search: "Elf",
      creatorId: testUser.id,
    });

    expect(result.data).toHaveLength(3);
    expect(result.data.map((a) => a.name)).toContain("Elf");
    expect(result.data.map((a) => a.name)).toContain("Half-Elf");
    expect(result.data.map((a) => a.name)).toContain("Wood Elf");
  });

  it("should return empty when no results match search", async () => {
    const result = await paginatePublicAncestries({
      limit: 10,
      sort: "name",
      search: "Dragonborn",
      creatorId: testUser.id,
    });

    expect(result.data).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });
});
