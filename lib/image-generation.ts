import { trace } from "@opentelemetry/api";
import { generateBlobFilename, uploadBlob } from "@/lib/blob-storage";
import { getBrowser, withRenderLimit } from "@/lib/browser";
import {
  claimImageGeneration,
  completeImageGeneration,
  type EntityImageClaim,
  failImageGeneration,
  waitForImageGeneration,
} from "@/lib/db/entity-images";
import type { EntityImageType } from "@/lib/db/schema";

export interface ImageGenerationOptions {
  baseUrl: string;
  entityId: string;
  entityUrlPath: string;
  entityType: "monster" | "companion" | "item";
}

export async function generateEntityImageWithStorage({
  baseUrl,
  entityId,
  entityUrlPath,
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

        const imageBuffer = await withRenderLimit(() =>
          generateEntityImageDirect({
            baseUrl,
            entityId,
            entityUrlPath,
            entityType,
          })
        );

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

async function generateEntityImageDirect({
  baseUrl,
  entityId,
  entityUrlPath,
  entityType,
}: ImageGenerationOptions): Promise<Buffer> {
  const tracer = trace.getTracer("image-generation");
  const entityPageUrl = `${baseUrl}${entityUrlPath}`;

  return tracer.startActiveSpan(
    `generate-${entityType}-image-direct`,
    async (span) => {
      span.setAttributes({
        "entity.id": entityId,
        "entity.type": entityType,
        "page.url": entityPageUrl,
        "page.base_url": baseUrl,
      });

      // biome-ignore lint/suspicious/noExplicitAny: browser types
      let browser: any;
      // biome-ignore lint/suspicious/noExplicitAny: browser types
      let page: any;

      try {
        const browserStartTime = Date.now();

        span.setAttributes({
          "browser.node_env": process.env.NODE_ENV || "unknown",
        });

        try {
          browser = await getBrowser();
          const browserTime = Date.now() - browserStartTime;

          span.setAttributes({
            "browser.acquisition_time_ms": browserTime,
            "browser.acquisition_success": true,
          });
        } catch (browserError) {
          const browserTime = Date.now() - browserStartTime;
          const browserErrorMessage =
            browserError instanceof Error
              ? browserError.message
              : String(browserError);

          span.setAttributes({
            "browser.acquisition_time_ms": browserTime,
            "browser.acquisition_success": false,
            "browser.acquisition_error": browserErrorMessage,
          });

          throw new Error(
            `Browser acquisition failed after ${browserTime}ms: ${browserErrorMessage}`
          );
        }

        const pageStartTime = Date.now();

        const avatarRequests: Array<{
          url: string;
          status: number;
          method: string;
        }> = [];

        try {
          page = await browser.newPage();

          // Set a realistic User-Agent to avoid bot detection
          await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          );

          // Set additional headers to look more like a real browser
          await page.setExtraHTTPHeaders({
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
          });

          // Monitor network requests for avatar loading debugging
          // biome-ignore lint/suspicious/noExplicitAny: browser types
          page.on("response", (response: any) => {
            const url = response.url();
            if (url.includes("cdn.discordapp.com")) {
              avatarRequests.push({
                url,
                status: response.status(),
                method: response.request().method(),
              });
            }
          });

          const pageCreationTime = Date.now() - pageStartTime;

          span.setAttributes({
            "page.creation_time_ms": pageCreationTime,
            "page.creation_success": true,
          });
        } catch (pageError) {
          const pageCreationTime = Date.now() - pageStartTime;
          const pageErrorMessage =
            pageError instanceof Error ? pageError.message : String(pageError);

          span.setAttributes({
            "page.creation_time_ms": pageCreationTime,
            "page.creation_success": false,
            "page.creation_error": pageErrorMessage,
          });

          throw new Error(
            `Page creation failed after ${pageCreationTime}ms: ${pageErrorMessage}`
          );
        }

        await page.setViewport({
          width: 1200,
          height: 630,
          deviceScaleFactor: 2,
        });

        const navigationStartTime = Date.now();

        span.setAttributes({
          "page.navigation_start": true,
          "page.url_attempting": entityPageUrl,
        });

        // biome-ignore lint/suspicious/noExplicitAny: browser types
        let response: any;
        try {
          response = await page.goto(entityPageUrl, {
            waitUntil: "domcontentloaded",
            timeout: 15000,
          });

          span.setAttributes({
            "page.navigation_phase": "domcontentloaded_success",
            "page.navigation_time_ms": Date.now() - navigationStartTime,
          });
        } catch (navigationError) {
          const navigationTime = Date.now() - navigationStartTime;
          const errorMessage =
            navigationError instanceof Error
              ? navigationError.message
              : String(navigationError);

          span.setAttributes({
            "page.navigation_phase": "initial_navigation_failed",
            "page.navigation_time_ms": navigationTime,
            "page.navigation_error": errorMessage,
          });

          throw new Error(
            `Navigation failed after ${navigationTime}ms: ${errorMessage}`
          );
        }

        const responseStatus = response?.status();
        const navigationTime = Date.now() - navigationStartTime;

        span.setAttributes({
          "page.navigation_time_ms": navigationTime,
          "page.response_status": responseStatus || 0,
          "page.response_ok": response?.ok() || false,
          "page.response_url": response?.url() || "unknown",
        });

        if (!response || responseStatus !== 200) {
          const responseText = response
            ? await response.text().catch(() => "Could not read response")
            : "No response";
          span.setAttributes({
            "page.response_text_preview": responseText.substring(0, 500),
          });

          throw new Error(
            `Failed to load ${entityType} page: ${responseStatus || "no response"} - ${responseText.substring(0, 200)}`
          );
        }

        // Wait for avatar images to load
        const avatarWaitStartTime = Date.now();
        try {
          await page.waitForFunction(
            () => {
              const avatarImages = Array.from(
                document.querySelectorAll('img[src*="cdn.discordapp.com"]')
              );
              return avatarImages.every(
                (img) =>
                  (img as HTMLImageElement).complete &&
                  (img as HTMLImageElement).naturalHeight !== 0
              );
            },
            { timeout: 5000 }
          );

          const avatarWaitTime = Date.now() - avatarWaitStartTime;

          span.setAttributes({
            "page.avatar_wait_time_ms": avatarWaitTime,
            "page.avatar_load_state": "loaded",
            "page.avatar_requests_count": avatarRequests.length,
            "page.avatar_request_statuses": avatarRequests
              .map((r) => r.status)
              .join(","),
          });
        } catch (avatarError) {
          const avatarWaitTime = Date.now() - avatarWaitStartTime;

          const avatarImageInfo: {
            src: string;
            complete: boolean;
            naturalHeight: number;
            naturalWidth: number;
          }[] = await page.evaluate(() => {
            const avatarImages = Array.from(
              document.querySelectorAll('img[src*="cdn.discordapp.com"]')
            );
            return avatarImages.map((img) => {
              const imgEl = img as HTMLImageElement;
              return {
                src: imgEl.src,
                complete: imgEl.complete,
                naturalHeight: imgEl.naturalHeight,
                naturalWidth: imgEl.naturalWidth,
              };
            });
          });

          span.setAttributes({
            "page.avatar_wait_time_ms": avatarWaitTime,
            "page.avatar_load_state": "timeout_but_continuing",
            "page.avatar_error":
              avatarError instanceof Error
                ? avatarError.message
                : String(avatarError),
            "page.avatar_requests_count": avatarRequests.length,
            "page.avatar_request_statuses": avatarRequests
              .map((r) => r.status)
              .join(","),
            "page.avatar_image_count": avatarImageInfo.length,
            "page.avatar_images_failed": avatarImageInfo.filter(
              (img) => !img.complete || img.naturalHeight === 0
            ).length,
            "page.avatar_blocking_urls": avatarImageInfo
              .filter((img) => !img.complete || img.naturalHeight === 0)
              .map((img) => img.src)
              .join(",")
              .substring(0, 500),
          });
        }

        try {
          await page.waitForFunction('document.readyState === "complete"', {
            timeout: 3000,
          });

          span.setAttributes({
            "page.final_load_state": "complete",
          });
        } catch (loadStateError) {
          span.setAttributes({
            "page.final_load_state": "timeout_but_continuing",
            "page.load_state_error":
              loadStateError instanceof Error
                ? loadStateError.message
                : String(loadStateError),
          });
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
            const container = document.querySelector(
              ".container .max-w-2xl"
            ) as HTMLElement | null;

            if (container) {
              container.style.boxSizing = "border-box";
              container.style.display = "flex";
              container.style.justifyContent = "center";
              container.style.alignItems = "center";
              container.style.margin = "0";
              container.style.padding = "0";
            }

            const actionsToRemove = document.querySelectorAll(
              `[id^="${entityType}-"] button`
            );
            actionsToRemove.forEach((el) => {
              (el as HTMLElement).style.display = "none";
            });

            const entityCard = document.querySelector(
              `#${entityType}-${entityId}`
            ) as HTMLElement | null;
            if (entityCard) {
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
