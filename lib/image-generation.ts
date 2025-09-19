import { trace } from "@opentelemetry/api";
import { generateBlobFilename, uploadBlob } from "@/lib/blob-storage";
import {
  claimImageGeneration,
  completeImageGeneration,
  type EntityImageClaim,
  failImageGeneration,
  waitForImageGeneration,
} from "@/lib/db/entity-images";
import type { entity_image_type as EntityImageType } from "@/lib/prisma";

export interface ImageGenerationOptions {
  baseUrl: string;
  entityId: string;
  entityType: "monster" | "companion" | "item";
}

export async function generateEntityImageWithStorage({
  baseUrl,
  entityId,
  entityType,
  entityVersion,
}: ImageGenerationOptions & { entityVersion: string }): Promise<string> {
  const tracer = trace.getTracer("image-generation");

  return tracer.startActiveSpan(
    `generate-${entityType}-image-with-storage`,
    async (span) => {
      span.setAttributes({
        "entity.id": entityId,
        "entity.type": entityType,
        "entity.version": entityVersion,
        "page.base_url": baseUrl,
      });

      const entityImageType = entityType as EntityImageType;
      let claim: EntityImageClaim | null = null;

      try {
        // Try to claim generation or get existing result
        claim = await claimImageGeneration(
          entityImageType,
          entityId,
          entityVersion
        );

        span.setAttributes({
          "claim.id": claim.id,
          "claim.claimed": claim.claimed,
        });

        // If we didn't claim it, either wait for generation or return existing
        if (!claim.claimed) {
          if (claim.existing?.blobUrl) {
            span.setAttributes({
              "cache.hit": true,
              "blob.url": claim.existing.blobUrl,
            });
            span.setStatus({ code: 1 }); // OK
            return claim.existing.blobUrl;
          }

          // Wait for ongoing generation
          span.setAttributes({ "waiting.for_generation": true });
          const completedRecord = await waitForImageGeneration(claim.id);

          if (!completedRecord.blobUrl) {
            throw new Error("Completed image generation has no blob URL");
          }

          span.setAttributes({
            "cache.wait_hit": true,
            "blob.url": completedRecord.blobUrl,
          });
          span.setStatus({ code: 1 }); // OK
          return completedRecord.blobUrl;
        }

        // We claimed generation, now actually generate the image
        span.setAttributes({ "generation.claimed": true });

        const imageBuffer = await generateEntityImageViaService({
          baseUrl,
          entityId,
          entityType,
        });

        // Upload to blob storage
        const filename = generateBlobFilename(
          entityType,
          entityId,
          entityVersion
        );
        const uploadStartTime = Date.now();
        const blobResult = await uploadBlob(filename, imageBuffer, "image/png");
        const uploadTime = Date.now() - uploadStartTime;

        span.setAttributes({
          "upload.time_ms": uploadTime,
          "upload.filename": filename,
          "blob.url": blobResult.url,
        });

        // Mark generation as complete
        await completeImageGeneration(claim.id, blobResult.url);

        span.setStatus({ code: 1 }); // OK
        return blobResult.url;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        span.setAttributes({
          "error.message": errorMessage,
          "error.type":
            error instanceof Error ? error.constructor.name : "Unknown",
        });

        if (errorStack) {
          span.setAttributes({ "error.stack": errorStack });
        }

        // Mark generation as failed if we claimed it
        if (claim?.claimed) {
          try {
            await failImageGeneration(claim.id, errorMessage);
          } catch (failError) {
            console.warn(
              "Failed to mark image generation as failed:",
              failError
            );
          }
        }

        span.setStatus({ code: 2, message: errorMessage }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

async function generateEntityImageViaService({
  baseUrl,
  entityId,
  entityType,
}: ImageGenerationOptions): Promise<Buffer> {
  const tracer = trace.getTracer("image-generation");

  return tracer.startActiveSpan(
    `generate-${entityType}-image-via-service`,
    async (span) => {
      const entityPageUrl = (() => {
        switch (entityType) {
          case "monster":
            return `${baseUrl}/m/${entityId}`;
          case "companion":
            return `${baseUrl}/companions/${entityId}`;
          case "item":
            return `${baseUrl}/items/${entityId}`;
          default:
            throw new Error(`Unknown entity type: ${entityType}`);
        }
      })();

      span.setAttributes({
        "entity.id": entityId,
        "entity.type": entityType,
        "page.url": entityPageUrl,
        "page.base_url": baseUrl,
        "service.method": "http_request",
      });

      try {
        const serviceUrl = process.env.IMGEN_SERVICE_URL;
        const secret = process.env.IMGEN_SECRET;

        if (!serviceUrl) {
          throw new Error("IMGEN_SERVICE_URL environment variable not set");
        }

        if (!secret) {
          throw new Error("IMGEN_SECRET environment variable not set");
        }

        span.setAttributes({
          "service.url": serviceUrl,
          "service.has_secret": !!secret,
        });

        const requestStartTime = Date.now();

        const response = await fetch(`${serviceUrl}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-IMGEN-SECRET": secret,
          },
          body: JSON.stringify({
            type: entityType,
            id: entityId,
            url: entityPageUrl,
          }),
        });

        const requestTime = Date.now() - requestStartTime;

        span.setAttributes({
          "service.request_time_ms": requestTime,
          "service.response_status": response.status,
          "service.response_ok": response.ok,
        });

        if (!response.ok) {
          const errorText = await response
            .text()
            .catch(() => "Could not read error response");
          span.setAttributes({
            "service.error_response": errorText,
          });
          throw new Error(
            `Image generation service failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("image/png")) {
          span.setAttributes({
            "service.unexpected_content_type": contentType || "unknown",
          });
          throw new Error(
            `Unexpected content type from service: ${contentType}`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        span.setAttributes({
          "service.response_size": buffer.length,
        });

        span.setStatus({ code: 1 }); // OK
        return buffer;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        span.setAttributes({
          "error.message": errorMessage,
          "error.type":
            error instanceof Error ? error.constructor.name : "Unknown",
        });

        if (errorStack) {
          span.setAttributes({ "error.stack": errorStack });
        }

        span.setStatus({ code: 2, message: errorMessage }); // ERROR

        console.error(
          `Image generation service failed for ${entityType} ${entityId}:`,
          {
            entityId,
            entityType,
            pageUrl: entityPageUrl,
            error: errorMessage,
            stack: errorStack,
          }
        );

        throw error;
      } finally {
        span.end();
      }
    }
  );
}
