import { trace } from "@opentelemetry/api";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type EntityImageRow,
  type EntityImageType,
  entityImages,
  type GenerationStatus,
} from "@/lib/db/schema";

export interface EntityImageClaim {
  id: string;
  claimed: boolean;
  existing?: EntityImageRow | null;
}

const GENERATION_TIMEOUT_MS = 31 * 1000;

function generateId(): string {
  return crypto.randomUUID();
}

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
    const db = await getDatabase();
    const now = new Date().toISOString();

    const existingRows = await db
      .select()
      .from(entityImages)
      .where(
        and(
          eq(entityImages.entityType, entityType),
          eq(entityImages.entityId, entityId)
        )
      )
      .limit(1);
    const existing = existingRows[0] ?? null;

    if (!existing) {
      const id = generateId();
      try {
        const createdRows = await db
          .insert(entityImages)
          .values({
            id,
            entityType,
            entityId,
            entityVersion,
            generationStatus: "generating" as GenerationStatus,
            generationStartedAt: now,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        const created = createdRows[0];

        span.setAttributes({
          "claim.id": created.id,
          "claim.claimed": true,
          "record.created": true,
        });

        return {
          id: created.id,
          claimed: true,
        };
      } catch (insertError) {
        const insertErrorMessage =
          insertError instanceof Error
            ? insertError.message
            : String(insertError);
        const insertErrorStack =
          insertError instanceof Error ? insertError.stack : undefined;
        // Extract additional error properties for better diagnostics
        const errorCode =
          insertError instanceof Error
            ? (insertError as Error & { code?: string }).code
            : undefined;
        const errorCause =
          insertError instanceof Error && insertError.cause
            ? String(insertError.cause)
            : undefined;

        span.setAttributes({
          "insert.error": true,
          "insert.error.message": insertErrorMessage,
          "insert.error.type":
            insertError instanceof Error
              ? insertError.constructor.name
              : "Unknown",
        });

        if (insertErrorStack) {
          span.setAttributes({ "insert.error.stack": insertErrorStack });
        }

        if (errorCode) {
          span.setAttributes({ "insert.error.code": errorCode });
        }

        if (errorCause) {
          span.setAttributes({ "insert.error.cause": errorCause });
        }

        // Check if another process inserted while we were trying (race condition)
        const raceExistingRows = await db
          .select()
          .from(entityImages)
          .where(
            and(
              eq(entityImages.entityType, entityType),
              eq(entityImages.entityId, entityId)
            )
          )
          .limit(1);
        const raceExisting = raceExistingRows[0] ?? null;

        if (raceExisting) {
          span.setAttributes({
            "claim.claimed": false,
            "race.condition": true,
          });

          return {
            id: raceExisting.id,
            claimed: false,
            existing: raceExisting,
          };
        }

        // No race condition - this is a real insert failure
        span.setAttributes({
          "insert.fatal": true,
        });
        span.setStatus({ code: 2, message: insertErrorMessage });

        // Build a more detailed error message
        const errorDetails = [
          `message: ${insertErrorMessage}`,
          errorCode ? `code: ${errorCode}` : null,
          errorCause ? `cause: ${errorCause}` : null,
        ]
          .filter(Boolean)
          .join(", ");

        const error = new Error(
          `Failed to create entity image record for ${entityType}/${entityId}: ${errorDetails}`
        );
        error.cause = insertError;
        throw error;
      }
    }

    span.setAttributes({
      "record.id": existing.id,
      "record.status": existing.generationStatus ?? "",
      "record.version": existing.entityVersion,
    });

    if (
      existing.entityVersion === entityVersion &&
      existing.generationStatus === "completed"
    ) {
      span.setAttributes({
        "claim.claimed": false,
        "existing.completed": true,
      });

      return {
        id: existing.id,
        claimed: false,
        existing,
      };
    }

    if (
      existing.entityVersion === entityVersion &&
      existing.generationStatus === "generating" &&
      existing.generationStartedAt
    ) {
      const generationAge =
        Date.now() - new Date(existing.generationStartedAt).getTime();

      if (generationAge <= GENERATION_TIMEOUT_MS) {
        span.setAttributes({
          "claim.claimed": false,
          "existing.in_progress": true,
          "generation.age_ms": generationAge,
        });

        return {
          id: existing.id,
          claimed: false,
          existing,
        };
      }
    }

    const updatedRows = await db
      .update(entityImages)
      .set({
        entityVersion,
        generationStatus: "generating" as GenerationStatus,
        generationStartedAt: now,
        updatedAt: now,
        ...(existing.entityVersion !== entityVersion
          ? { blobUrl: null, generatedAt: null }
          : {}),
      })
      .where(eq(entityImages.id, existing.id))
      .returning();
    const updated = updatedRows[0];

    span.setAttributes({
      "claim.claimed": true,
      "version.updated": existing.entityVersion !== entityVersion,
    });

    return {
      id: updated.id,
      claimed: true,
    };
  } finally {
    span.end();
  }
}

export async function completeImageGeneration(
  id: string,
  blobUrl: string
): Promise<EntityImageRow> {
  const tracer = trace.getTracer("entity-images");

  return tracer.startActiveSpan("complete-image-generation", async (span) => {
    span.setAttributes({
      "record.id": id,
      "blob.url": blobUrl,
    });

    try {
      const db = await getDatabase();
      const updatedRows = await db
        .update(entityImages)
        .set({
          generationStatus: "completed" as GenerationStatus,
          blobUrl,
          generatedAt: new Date().toISOString(),
        })
        .where(eq(entityImages.id, id))
        .returning();

      span.setStatus({ code: 1 });
      return updatedRows[0];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      span.setAttributes({ "error.message": errorMessage });
      span.setStatus({ code: 2, message: errorMessage });
      throw error;
    } finally {
      span.end();
    }
  });
}

export async function failImageGeneration(
  id: string,
  error?: string
): Promise<EntityImageRow> {
  const tracer = trace.getTracer("entity-images");

  return tracer.startActiveSpan("fail-image-generation", async (span) => {
    span.setAttributes({
      "record.id": id,
      "error.message": error || "Unknown error",
    });

    try {
      const db = await getDatabase();
      const updatedRows = await db
        .update(entityImages)
        .set({
          generationStatus: "failed" as GenerationStatus,
        })
        .where(eq(entityImages.id, id))
        .returning();

      span.setStatus({ code: 1 });
      return updatedRows[0];
    } catch (dbError) {
      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);
      span.setAttributes({ "db.error.message": errorMessage });
      span.setStatus({ code: 2, message: errorMessage });
      throw dbError;
    } finally {
      span.end();
    }
  });
}

export async function getEntityImage(
  entityType: EntityImageType,
  entityId: string
): Promise<EntityImageRow | null> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(entityImages)
    .where(
      and(
        eq(entityImages.entityType, entityType),
        eq(entityImages.entityId, entityId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function waitForImageGeneration(
  id: string,
  maxWaitMs: number = 30000
): Promise<EntityImageRow> {
  const startTime = Date.now();
  const pollInterval = 1000;
  const db = await getDatabase();

  while (Date.now() - startTime < maxWaitMs) {
    const rows = await db
      .select()
      .from(entityImages)
      .where(eq(entityImages.id, id))
      .limit(1);
    const record = rows[0] ?? null;

    if (!record) {
      throw new Error("Entity image record not found");
    }

    if (record.generationStatus === "completed") {
      return record;
    }

    if (record.generationStatus === "failed") {
      throw new Error("Image generation failed");
    }

    if (record.generationStartedAt) {
      const generationAge =
        Date.now() - new Date(record.generationStartedAt).getTime();
      if (generationAge > GENERATION_TIMEOUT_MS) {
        throw new Error("Image generation timed out");
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Timeout waiting for image generation");
}
