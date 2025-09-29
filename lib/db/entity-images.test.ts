import { afterEach, describe, expect, it } from "vitest";
import { generation_status as GenerationStatus } from "@/lib/prisma";
import { claimImageGeneration } from "./entity-images";
import { prisma } from "./index";

describe("claimImageGeneration", () => {
  const entityType = "monster" as const;
  const entityId = "00000000-0000-0000-0000-000000000001";
  const entityVersion = "v1";

  afterEach(async () => {
    await prisma.entityImage.deleteMany({
      where: { entityId },
    });
  });

  it("should create and claim a new record", async () => {
    const result = await claimImageGeneration(
      entityType,
      entityId,
      entityVersion
    );

    expect(result.claimed).toBe(true);
    expect(result.id).toBeDefined();

    const record = await prisma.entityImage.findUnique({
      where: { id: result.id },
    });
    expect(record).toBeTruthy();
    expect(record?.entityType).toBe(entityType);
    expect(record?.entityId).toBe(entityId);
    expect(record?.entityVersion).toBe(entityVersion);
    expect(record?.generationStatus).toBe(GenerationStatus.generating);
  });

  it("should return existing completed record", async () => {
    const existing = await prisma.entityImage.create({
      data: {
        entityType,
        entityId,
        entityVersion,
        generationStatus: GenerationStatus.completed,
        blobUrl: "https://example.com/image.png",
        generatedAt: new Date(),
      },
    });

    const result = await claimImageGeneration(
      entityType,
      entityId,
      entityVersion
    );

    expect(result.claimed).toBe(false);
    expect(result.id).toBe(existing.id);
    expect(result.existing?.blobUrl).toBe("https://example.com/image.png");
  });

  it("should return unclaimed for in-progress generation (not stale)", async () => {
    await prisma.entityImage.create({
      data: {
        entityType,
        entityId,
        entityVersion,
        generationStatus: GenerationStatus.generating,
        generationStartedAt: new Date(),
      },
    });

    const result = await claimImageGeneration(
      entityType,
      entityId,
      entityVersion
    );

    expect(result.claimed).toBe(false);
    expect(result.existing?.generationStatus).toBe(GenerationStatus.generating);
  });

  it("should take over stale generation", async () => {
    const staleTime = new Date(Date.now() - 35 * 1000);
    await prisma.entityImage.create({
      data: {
        entityType,
        entityId,
        entityVersion,
        generationStatus: GenerationStatus.generating,
        generationStartedAt: staleTime,
      },
    });

    const result = await claimImageGeneration(
      entityType,
      entityId,
      entityVersion
    );

    expect(result.claimed).toBe(true);

    const record = await prisma.entityImage.findUnique({
      where: { id: result.id },
    });
    expect(record?.generationStartedAt.getTime()).toBeGreaterThan(
      staleTime.getTime()
    );
  });

  it("should take over failed generation", async () => {
    const existing = await prisma.entityImage.create({
      data: {
        entityType,
        entityId,
        entityVersion,
        generationStatus: GenerationStatus.failed,
        generationStartedAt: new Date(Date.now() - 5000),
      },
    });

    const result = await claimImageGeneration(
      entityType,
      entityId,
      entityVersion
    );

    expect(result.claimed).toBe(true);
    expect(result.id).toBe(existing.id);

    const record = await prisma.entityImage.findUnique({
      where: { id: result.id },
    });
    expect(record?.generationStatus).toBe(GenerationStatus.generating);
  });

  it("should update version and claim", async () => {
    const oldVersion = "v0";
    const newVersion = "v1";

    await prisma.entityImage.create({
      data: {
        entityType,
        entityId,
        entityVersion: oldVersion,
        generationStatus: GenerationStatus.completed,
        blobUrl: "https://example.com/old.png",
        generatedAt: new Date(),
      },
    });

    const result = await claimImageGeneration(entityType, entityId, newVersion);

    expect(result.claimed).toBe(true);

    const record = await prisma.entityImage.findUnique({
      where: { id: result.id },
    });
    expect(record?.entityVersion).toBe(newVersion);
    expect(record?.blobUrl).toBeNull();
    expect(record?.generationStatus).toBe(GenerationStatus.generating);
  });

  it("should handle concurrent claims with lock", async () => {
    const [claim1Result, claim2Result] = await Promise.all([
      claimImageGeneration(entityType, entityId, entityVersion),
      claimImageGeneration(entityType, entityId, entityVersion),
    ]);

    expect(claim1Result.claimed || claim2Result.claimed).toBe(true);
    expect(claim1Result.claimed && claim2Result.claimed).toBe(false);

    if (claim1Result.claimed) {
      expect(claim2Result.claimed).toBe(false);
      expect(claim2Result.existing).toBeTruthy();
    } else {
      expect(claim1Result.claimed).toBe(false);
      expect(claim1Result.existing).toBeTruthy();
    }

    const records = await prisma.entityImage.findMany({
      where: { entityId },
    });
    expect(records).toHaveLength(1);
  });

  it("should handle multiple concurrent claims", async () => {
    const results = await Promise.all([
      claimImageGeneration(entityType, entityId, entityVersion),
      claimImageGeneration(entityType, entityId, entityVersion),
      claimImageGeneration(entityType, entityId, entityVersion),
      claimImageGeneration(entityType, entityId, entityVersion),
    ]);

    const claimedCount = results.filter((r) => r.claimed).length;
    expect(claimedCount).toBe(1);

    const unclaimedCount = results.filter((r) => !r.claimed).length;
    expect(unclaimedCount).toBe(3);

    const records = await prisma.entityImage.findMany({
      where: { entityId },
    });
    expect(records).toHaveLength(1);
  });
});
