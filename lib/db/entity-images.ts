import { trace } from "@opentelemetry/api";
import { Prisma } from "@/lib/prisma";
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
  const span = tracer.startSpan("claim-image-generation", {
    attributes: {
      "entity.type": entityType,
      "entity.id": entityId,
      "entity.version": entityVersion,
    },
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();

      const inserted = await tx.$queryRaw<Array<{ id: string }>>(
        Prisma.sql`
          INSERT INTO entity_images (id, entity_type, entity_id, entity_version, generation_status, generation_started_at, created_at, updated_at)
          VALUES (uuid_generate_v4(), CAST(${entityType} AS entity_image_type), CAST(${entityId} AS uuid), ${entityVersion}, 'generating', ${now}, ${now}, ${now})
          ON CONFLICT (entity_type, entity_id) DO NOTHING
          RETURNING id
        `
      );

      if (inserted.length > 0) {
        span.setAttributes({
          "claim.id": inserted[0].id,
          "claim.claimed": true,
          "record.created": true,
        });

        return {
          id: inserted[0].id,
          claimed: true,
        };
      }

      const locked = await tx.$queryRaw<
        Array<{
          id: string;
          entity_type: string;
          entity_id: string;
          entity_version: string;
          generation_status: string;
          generation_started_at: Date;
          blob_url: string | null;
          generated_at: Date | null;
          created_at: Date;
          updated_at: Date;
        }>
      >(
        Prisma.sql`
          SELECT * FROM entity_images
          WHERE entity_type = CAST(${entityType} AS entity_image_type)
            AND entity_id = CAST(${entityId} AS uuid)
          FOR UPDATE SKIP LOCKED
        `
      );

      if (locked.length === 0) {
        const existing = await tx.entityImage.findUnique({
          where: {
            entityType_entityId: { entityType, entityId },
          },
        });

        if (!existing) {
          throw new Error("Entity image record disappeared");
        }

        span.setAttributes({
          "claim.claimed": false,
          "lock.held_by_other": true,
          "existing.status": existing.generationStatus,
        });

        return {
          id: existing.id,
          claimed: false,
          existing,
        };
      }

      const record = locked[0];

      span.setAttributes({
        "record.id": record.id,
        "record.status": record.generation_status,
        "record.version": record.entity_version,
      });

      if (
        record.entity_version === entityVersion &&
        record.generation_status === "completed"
      ) {
        span.setAttributes({
          "claim.claimed": false,
          "existing.completed": true,
        });

        const mappedRecord = await tx.entityImage.findUnique({
          where: { id: record.id },
        });

        return {
          id: record.id,
          claimed: false,
          existing: mappedRecord,
        };
      }

      if (
        record.entity_version === entityVersion &&
        record.generation_status === "generating"
      ) {
        const generationAge =
          Date.now() - new Date(record.generation_started_at).getTime();

        if (generationAge <= GENERATION_TIMEOUT_MS) {
          span.setAttributes({
            "claim.claimed": false,
            "existing.in_progress": true,
            "generation.age_ms": generationAge,
          });

          const mappedRecord = await tx.entityImage.findUnique({
            where: { id: record.id },
          });

          return {
            id: record.id,
            claimed: false,
            existing: mappedRecord,
          };
        }

        await tx.entityImage.update({
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
          id: record.id,
          claimed: true,
        };
      }

      const needsVersionUpdate = record.entity_version !== entityVersion;

      await tx.entityImage.update({
        where: { id: record.id },
        data: {
          entityVersion,
          generationStatus: GenerationStatus.generating,
          generationStartedAt: new Date(),
          ...(needsVersionUpdate ? { blobUrl: null, generatedAt: null } : {}),
        },
      });

      span.setAttributes({
        "claim.claimed": true,
        ...(needsVersionUpdate
          ? {
              "version.updated": true,
              "old.version": record.entity_version,
            }
          : {
              "takeover.failed": true,
            }),
      });

      return {
        id: record.id,
        claimed: true,
      };
    });
  } finally {
    span.end();
  }
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
