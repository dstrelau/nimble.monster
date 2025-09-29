import { trace } from "@opentelemetry/api";
import { prisma } from "@/lib/db";
import {
  type EntityImage,
  type entity_image_type as EntityImageType,
  generation_status as GenerationStatus,
} from "@/lib/prisma";

export interface EntityImageClaim {
  id: string;
  claimed: boolean;
  existing?: EntityImage | null;
}

const GENERATION_TIMEOUT_MS = 31 * 1000;

export async function claimImageGeneration(
  entityType: EntityImageType,
  entityId: string,
  entityVersion: string
): Promise<EntityImageClaim> {
  const tracer = trace.getTracer("entity-images");

  return tracer.startActiveSpan("claim-image-generation", async (span) => {
    span.setAttributes({
      "entity.type": entityType,
      "entity.id": entityId,
      "entity.version": entityVersion,
    });

    try {
      // Use upsert to atomically handle creation/update - eliminates race condition
      const record = await prisma.entityImage.upsert({
        where: {
          entityType_entityId: {
            entityType,
            entityId,
          },
        },
        create: {
          entityType,
          entityId,
          entityVersion,
          generationStatus: GenerationStatus.generating,
          generationStartedAt: new Date(),
        },
        update: {}, // No update on conflict - we'll handle logic below
      });

      span.setAttributes({
        "record.id": record.id,
        "record.status": record.generationStatus,
        "record.version": record.entityVersion,
      });

      // Check if the record is for the current version
      if (record.entityVersion === entityVersion) {
        if (record.generationStatus === GenerationStatus.completed) {
          span.setAttributes({
            "claim.claimed": false,
            "existing.completed": true,
          });
          return {
            id: record.id,
            claimed: false,
            existing: record,
          };
        }

        // Check if generation is stale (timeout)
        const generationAge = Date.now() - record.generationStartedAt.getTime();
        if (generationAge > GENERATION_TIMEOUT_MS) {
          // Take over stale generation
          const updatedRecord = await prisma.entityImage.update({
            where: { id: record.id },
            data: {
              generationStatus: GenerationStatus.generating,
              generationStartedAt: new Date(),
            },
          });

          span.setAttributes({
            "claim.claimed": true,
            "takeover.stale": true,
            "generation.age_ms": generationAge,
          });

          return {
            id: updatedRecord.id,
            claimed: true,
          };
        }

        // Generation is in progress and not stale
        span.setAttributes({
          "claim.claimed": false,
          "existing.in_progress": true,
          "generation.age_ms": generationAge,
        });

        return {
          id: record.id,
          claimed: false,
          existing: record,
        };
      }

      // Version has changed, update to new version and claim
      const updatedRecord = await prisma.entityImage.update({
        where: { id: record.id },
        data: {
          entityVersion,
          generationStatus: GenerationStatus.generating,
          generationStartedAt: new Date(),
          blobUrl: null,
          generatedAt: null,
        },
      });

      span.setAttributes({
        "claim.claimed": true,
        "version.updated": true,
        "old.version": record.entityVersion,
        "new.version": entityVersion,
      });

      return {
        id: updatedRecord.id,
        claimed: true,
      };
    } finally {
      span.end();
    }
  });
}

export async function completeImageGeneration(
  id: string,
  blobUrl: string
): Promise<EntityImage> {
  const tracer = trace.getTracer("entity-images");

  return tracer.startActiveSpan("complete-image-generation", async (span) => {
    span.setAttributes({
      "record.id": id,
      "blob.url": blobUrl,
    });

    try {
      const updatedRecord = await prisma.entityImage.update({
        where: { id },
        data: {
          generationStatus: GenerationStatus.completed,
          blobUrl,
          generatedAt: new Date(),
        },
      });

      span.setStatus({ code: 1 }); // OK
      return updatedRecord;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      span.setAttributes({ "error.message": errorMessage });
      span.setStatus({ code: 2, message: errorMessage }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  });
}

export async function failImageGeneration(
  id: string,
  error?: string
): Promise<EntityImage> {
  const tracer = trace.getTracer("entity-images");

  return tracer.startActiveSpan("fail-image-generation", async (span) => {
    span.setAttributes({
      "record.id": id,
      "error.message": error || "Unknown error",
    });

    try {
      const updatedRecord = await prisma.entityImage.update({
        where: { id },
        data: {
          generationStatus: GenerationStatus.failed,
        },
      });

      span.setStatus({ code: 1 }); // OK
      return updatedRecord;
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);
      span.setAttributes({ "db.error.message": errorMessage });
      span.setStatus({ code: 2, message: errorMessage }); // ERROR
      throw dbError;
    } finally {
      span.end();
    }
  });
}

export async function getEntityImage(
  entityType: EntityImageType,
  entityId: string
): Promise<EntityImage | null> {
  return prisma.entityImage.findUnique({
    where: {
      entityType_entityId: {
        entityType,
        entityId,
      },
    },
  });
}

export async function waitForImageGeneration(
  id: string,
  maxWaitMs: number = 30000
): Promise<EntityImage> {
  const startTime = Date.now();
  const pollInterval = 1000; // 1 second

  while (Date.now() - startTime < maxWaitMs) {
    const record = await prisma.entityImage.findUnique({
      where: { id },
    });

    if (!record) {
      throw new Error("Entity image record not found");
    }

    if (record.generationStatus === GenerationStatus.completed) {
      return record;
    }

    if (record.generationStatus === GenerationStatus.failed) {
      throw new Error("Image generation failed");
    }

    // Check if generation has timed out
    const generationAge = Date.now() - record.generationStartedAt.getTime();
    if (generationAge > GENERATION_TIMEOUT_MS) {
      throw new Error("Image generation timed out");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Timeout waiting for image generation");
}
