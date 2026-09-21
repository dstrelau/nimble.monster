import { trace } from "@opentelemetry/api";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type EntityImageRow,
  type EntityImageTheme,
  type EntityImageType,
  entityImages,
  type GenerationStatus,
} from "@/lib/db/schema";

export type EntityImageClaim =
  | {
      id: string;
      claimed: true;
      generationToken: string;
    }
  | {
      id: string;
      claimed: false;
      existing?: EntityImageRow | null;
    };

const GENERATION_TIMEOUT_MS = 7 * 60 * 1000;

function generateId(): string {
  return crypto.randomUUID();
}

export async function claimImageGeneration(
  entityType: EntityImageType,
  entityId: string,
  entityVersion: string,
  theme: EntityImageTheme
): Promise<EntityImageClaim> {
  const tracer = trace.getTracer("entity-images");
  const span = tracer.startSpan("claim-image-generation", {
    attributes: {
      "entity.type": entityType,
      "entity.id": entityId,
      "entity.version": entityVersion,
      "entity.theme": theme,
    },
  });

  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Use a transaction to ensure consistency between read and write operations.
    // With embedded replicas, this forces all operations to go through the primary,
    // preventing stale reads from the local replica if the write fails.
    return await db.transaction(async (tx) => {
      const existingRows = await tx
        .select()
        .from(entityImages)
        .where(
          and(
            eq(entityImages.entityType, entityType),
            eq(entityImages.entityId, entityId),
            eq(entityImages.theme, theme)
          )
        )
        .limit(1);
      const existing = existingRows[0] ?? null;

      if (!existing) {
        const id = generateId();
        const generationToken = generateId();
        try {
          const createdRows = await tx
            .insert(entityImages)
            .values({
              id,
              entityType,
              entityId,
              theme,
              entityVersion,
              generationStatus: "generating" as GenerationStatus,
              generationToken,
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
            generationToken,
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
          // This read is within the same transaction, so it will also go to the primary
          const raceExistingRows = await tx
            .select()
            .from(entityImages)
            .where(
              and(
                eq(entityImages.entityType, entityType),
                eq(entityImages.entityId, entityId),
                eq(entityImages.theme, theme)
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

      const generationToken = generateId();
      const updatedRows = await tx
        .update(entityImages)
        .set({
          entityVersion,
          generationStatus: "generating" as GenerationStatus,
          generationToken,
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
        generationToken,
      };
    });
  } finally {
    span.end();
  }
}

export async function completeImageGeneration(
  id: string,
  generationToken: string,
  entityVersion: string,
  blobUrl: string
): Promise<EntityImageRow> {
  const tracer = trace.getTracer("entity-images");

  return tracer.startActiveSpan("complete-image-generation", async (span) => {
    span.setAttributes({
      "record.id": id,
      "generation.token": generationToken,
      "entity.version": entityVersion,
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
        .where(
          and(
            eq(entityImages.id, id),
            eq(entityImages.generationToken, generationToken),
            eq(entityImages.entityVersion, entityVersion),
            eq(entityImages.generationStatus, "generating")
          )
        )
        .returning();

      if (!updatedRows[0]) {
        throw new Error("Image generation claim is no longer current");
      }

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
  generationToken: string,
  entityVersion: string,
  error?: string
): Promise<EntityImageRow> {
  const tracer = trace.getTracer("entity-images");

  return tracer.startActiveSpan("fail-image-generation", async (span) => {
    span.setAttributes({
      "record.id": id,
      "generation.token": generationToken,
      "entity.version": entityVersion,
      "error.message": error || "Unknown error",
    });

    try {
      const db = await getDatabase();
      const updatedRows = await db
        .update(entityImages)
        .set({
          generationStatus: "failed" as GenerationStatus,
        })
        .where(
          and(
            eq(entityImages.id, id),
            eq(entityImages.generationToken, generationToken),
            eq(entityImages.entityVersion, entityVersion),
            eq(entityImages.generationStatus, "generating")
          )
        )
        .returning();

      if (!updatedRows[0]) {
        throw new Error("Image generation claim is no longer current");
      }

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
