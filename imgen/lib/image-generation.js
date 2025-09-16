const { trace } = require("@opentelemetry/api");
const { getBrowser } = require("./browser");

async function generateEntityImageDirect({ url, entityId, entityType }) {
  const tracer = trace.getTracer("image-generation");

  return tracer.startActiveSpan(
    `generate-${entityType}-image-direct`,
    async (span) => {
      span.setAttributes({
        "entity.id": entityId,
        "entity.type": entityType,
        "page.url": url,
      });

      let browser;
      let page;

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

        const avatarRequests = [];

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
          page.on("response", (response) => {
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

        // Add detailed debugging for navigation
        span.setAttributes({
          "page.navigation_start": true,
          "page.url_attempting": url,
        });

        let response;
        try {
          // Navigate with a shorter timeout and less strict waiting
          response = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 15000, // 15 second timeout
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

        // Check if we got a response
        const responseStatus = response?.status();
        const navigationTime = Date.now() - navigationStartTime;

        span.setAttributes({
          "page.navigation_time_ms": navigationTime,
          "page.response_status": responseStatus || 0,
          "page.response_ok": response?.ok() || false,
          "page.response_url": response?.url() || "unknown",
        });

        if (!response || responseStatus !== 200) {
          // Get more details about the failure
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

        // Wait for avatar images to load specifically
        const avatarWaitStartTime = Date.now();
        try {
          // Wait for any avatar images to load (Discord CDN URLs)
          await page.waitForFunction(
            () => {
              const avatarImages = Array.from(
                document.querySelectorAll('img[src*="cdn.discordapp.com"]')
              );
              return avatarImages.every(
                (img) => img.complete && img.naturalHeight !== 0
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
          // Non-fatal if avatars don't load, continue anyway
          const avatarWaitTime = Date.now() - avatarWaitStartTime;

          // Get more details about what avatar images are present but failed to load
          const avatarImageInfo = await page.evaluate(() => {
            const avatarImages = Array.from(
              document.querySelectorAll('img[src*="cdn.discordapp.com"]')
            );
            return avatarImages.map((img) => {
              return {
                src: img.src,
                complete: img.complete,
                naturalHeight: img.naturalHeight,
                naturalWidth: img.naturalWidth,
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
              .substring(0, 500), // Truncate to avoid too long attributes
          });
        }

        // Wait a bit more for the page to be fully ready
        try {
          await page.waitForFunction('document.readyState === "complete"', {
            timeout: 3000,
          });

          span.setAttributes({
            "page.final_load_state": "complete",
          });
        } catch (loadStateError) {
          // Non-fatal, continue anyway
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
          (params) => {
            const { entityId, entityType } = params;
            // Select the container of the entity card
            const container = document.querySelector(".container .max-w-2xl");

            // Apply consistent styling for OpenGraph image
            if (container) {
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
              el.style.display = "none";
            });

            // Ensure the card has the right background and styling
            const entityCard = document.querySelector(
              `#${entityType}-${entityId}`
            );
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
      } catch (error) {
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
            pageUrl: url,
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

module.exports = {
  generateEntityImageDirect,
};
