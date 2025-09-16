import { trace } from "@opentelemetry/api";
import { unstable_cacheTag as cacheTag } from "next/cache";
import { generateBlobFilename, uploadBlob } from "@/lib/blob-storage";
import { getBrowser } from "@/lib/browser";
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

        const imageBuffer = await generateEntityImageDirect({
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

export async function generateEntityImageDirect({
  baseUrl,
  entityId,
  entityType,
}: ImageGenerationOptions): Promise<Buffer> {
  const tracer = trace.getTracer("image-generation");

  return tracer.startActiveSpan(
    `generate-${entityType}-image-direct`,
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
      });

      // biome-ignore lint/suspicious/noExplicitAny: browser types. who knows.
      let browser: any;
      // biome-ignore lint/suspicious/noExplicitAny: ibid
      let page: any;

      try {
        const browserStartTime = Date.now();
        browser = await getBrowser();
        const browserTime = Date.now() - browserStartTime;

        span.setAttributes({
          "browser.acquisition_time_ms": browserTime,
        });

        const pageStartTime = Date.now();
        page = await browser.newPage();
        const pageCreationTime = Date.now() - pageStartTime;

        span.setAttributes({
          "page.creation_time_ms": pageCreationTime,
        });

        await page.setViewport({
          width: 1200,
          height: 630,
          deviceScaleFactor: 2,
        });

        const navigationStartTime = Date.now();
        const response = await page.goto(entityPageUrl, {
          waitUntil: "networkidle0",
        });
        const navigationTime = Date.now() - navigationStartTime;

        const responseStatus = response?.status();
        span.setAttributes({
          "page.navigation_time_ms": navigationTime,
          "page.response_status": responseStatus || 0,
        });

        if (!response || responseStatus !== 200) {
          throw new Error(
            `Failed to load ${entityType} page: ${responseStatus || "unknown error"}`
          );
        }

        const selectorStartTime = Date.now();
        await page.waitForSelector(`#${entityType}-${entityId}`);
        const selectorWaitTime = Date.now() - selectorStartTime;

        span.setAttributes({
          "page.selector_wait_time_ms": selectorWaitTime,
        });

        const evaluateStartTime = Date.now();
        await page.evaluate(
          (params: { entityId: string; entityType: string }) => {
            const { entityId, entityType } = params;
            // Select the container of the entity card
            const container = document.querySelector(
              ".container .max-w-2xl"
            ) as HTMLElement | null;

            // Apply consistent styling for OpenGraph image
            if (container) {
              // container.style.width = `${OG_WIDTH}px`;
              container.style.boxSizing = "border-box";
              container.style.display = "flex";
              container.style.justifyContent = "center";
              container.style.alignItems = "center";
              container.style.margin = "0";
              container.style.padding = "0";
            }

            // Remove unnecessary UI elements that shouldn't appear in the image
            const actionsToRemove = document.querySelectorAll(
              `[id^="${entityType}-"] button`
            );
            actionsToRemove.forEach((el) => {
              (el as HTMLElement).style.display = "none";
            });

            // Ensure the card has the right background and styling
            const entityCard = document.querySelector(
              `#${entityType}-${entityId}`
            ) as HTMLElement | null;
            if (entityCard) {
              // Ensure the card has proper padding for the image
              entityCard.style.padding = "20px";
            }
          },
          { entityId, entityType }
        );
        const evaluateTime = Date.now() - evaluateStartTime;

        span.setAttributes({
          "page.dom_manipulation_time_ms": evaluateTime,
        });

        const elementStartTime = Date.now();
        const entityCardElement = await page.$(`#${entityType}-${entityId}`);
        if (!entityCardElement) {
          throw new Error(`${entityType} card element not found`);
        }

        // Get the card's dimensions
        const boundingBox = await entityCardElement.boundingBox();
        if (!boundingBox) {
          throw new Error(`Could not determine ${entityType} card dimensions`);
        }
        const elementTime = Date.now() - elementStartTime;

        span.setAttributes({
          "page.element_selection_time_ms": elementTime,
          "screenshot.width": boundingBox.width,
          "screenshot.height": boundingBox.height,
          "screenshot.x": boundingBox.x,
          "screenshot.y": boundingBox.y,
        });

        const screenshotStartTime = Date.now();
        const screenshotBuffer = await page.screenshot({
          clip: {
            x: boundingBox.x,
            y: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
          },
          omitBackground: true,
          type: "png",
        });
        const screenshotTime = Date.now() - screenshotStartTime;

        const buffer = Buffer.from(screenshotBuffer);

        span.setAttributes({
          "screenshot.generation_time_ms": screenshotTime,
          "screenshot.buffer_size": buffer.length,
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
          `Image generation failed for ${entityType} ${entityId}:`,
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
        if (page) {
          try {
            await page.close();
          } catch (closeError) {
            console.warn("Failed to close page:", closeError);
          }
        }
        span.end();
      }
    }
  );
}
