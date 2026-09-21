import {
  context,
  propagation,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { generateEntityImagePath, uploadBlob } from "@/lib/blob-storage";
import { withBrowser } from "@/lib/browser";
import {
  claimImageGeneration,
  completeImageGeneration,
  type EntityImageClaim,
  failImageGeneration,
  findCompletedEntityImage,
} from "@/lib/db/entity-images";
import type { EntityImageTheme } from "@/lib/db/schema";
import { renderEntityImage } from "@/lib/entity-image-renderer";

export interface ImageGenerationOptions {
  baseUrl: string;
  entityId: string;
  entityUrlPath: string;
  entityType: "monster" | "companion" | "item";
  theme: EntityImageTheme;
}

const RENDERER_REQUEST_TIMEOUT_MS = 6 * 60_000;
const RENDERER_WAKE_TIMEOUT_MS = 30_000;
const MAX_RENDERED_IMAGE_BYTES = 5 * 1024 * 1024;

export class ImageRendererUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ImageRendererUnavailableError";
  }
}

export class ImageGenerationDeniedError extends Error {
  constructor() {
    super("Image generation is not permitted for this request");
    this.name = "ImageGenerationDeniedError";
  }
}

async function fetchRenderer(
  requestType: "health" | "render",
  url: URL,
  init: RequestInit & { headers: Record<string, string> }
): Promise<Response> {
  const tracer = trace.getTracer("image-generation");
  return tracer.startActiveSpan(
    `image-renderer.${requestType}`,
    { attributes: { "renderer.request.type": requestType } },
    async (span) => {
      propagation.inject(context.active(), init.headers);
      try {
        const response = await fetch(url, init);
        span.setAttribute("http.response.status_code", response.status);
        span.setStatus({
          code: response.ok ? SpanStatusCode.OK : SpanStatusCode.ERROR,
        });
        return response;
      } catch (error) {
        span.setAttribute(
          "error.type",
          error instanceof Error ? error.constructor.name : "Unknown"
        );
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

async function requestRenderedImage(
  options: ImageGenerationOptions
): Promise<Buffer> {
  const rendererUrl = process.env.IMAGE_RENDERER_URL;
  const rendererSecret = process.env.IMAGE_RENDERER_SECRET;
  if (!rendererUrl || !rendererSecret) {
    throw new ImageRendererUnavailableError("Image renderer is not configured");
  }

  try {
    const healthResponse = await fetchRenderer(
      "health",
      new URL("/health", rendererUrl),
      {
        headers: { "x-image-renderer-secret": rendererSecret },
        cache: "no-store",
        signal: AbortSignal.timeout(RENDERER_WAKE_TIMEOUT_MS),
      }
    );
    if (!healthResponse.ok) {
      throw new ImageRendererUnavailableError("Image renderer failed to wake");
    }

    const response = await fetchRenderer(
      "render",
      new URL("/render", rendererUrl),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-image-renderer-secret": rendererSecret,
        },
        body: JSON.stringify({
          entityId: options.entityId,
          entityUrlPath: options.entityUrlPath,
          entityType: options.entityType,
          theme: options.theme,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(RENDERER_REQUEST_TIMEOUT_MS),
      }
    );
    if (response.status === 503) {
      throw new ImageRendererUnavailableError("Image renderer is busy");
    }
    if (!response.ok || response.headers.get("content-type") !== "image/png") {
      throw new ImageRendererUnavailableError("Image renderer request failed");
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (
      (Number.isFinite(contentLength) &&
        contentLength > MAX_RENDERED_IMAGE_BYTES) ||
      contentLength < 0
    ) {
      throw new ImageRendererUnavailableError(
        "Image renderer response exceeded the size limit"
      );
    }

    const image = Buffer.from(await response.arrayBuffer());
    if (image.byteLength > MAX_RENDERED_IMAGE_BYTES) {
      throw new ImageRendererUnavailableError(
        "Image renderer response exceeded the size limit"
      );
    }
    return image;
  } catch (error) {
    if (error instanceof ImageRendererUnavailableError) throw error;
    throw new ImageRendererUnavailableError("Image renderer request failed", {
      cause: error,
    });
  }
}

async function generateImage(options: ImageGenerationOptions): Promise<Buffer> {
  if (process.env.NODE_ENV === "production") {
    return requestRenderedImage(options);
  }

  return withBrowser((browser) => renderEntityImage(options, browser));
}

export async function generateEntityImageWithStorage({
  allowGeneration = true,
  baseUrl,
  entityId,
  entityUrlPath,
  entityType,
  entityVersion,
  theme,
}: ImageGenerationOptions & {
  allowGeneration?: boolean;
  entityVersion: string;
}): Promise<string> {
  const tracer = trace.getTracer("image-generation");

  return tracer.startActiveSpan(
    `generate-${entityType}-image-with-storage`,
    async (span) => {
      span.setAttributes({
        "entity.id": entityId,
        "entity.type": entityType,
        "entity.version": entityVersion,
        "entity.theme": theme,
        "page.base_url": baseUrl,
      });

      let claim: EntityImageClaim | null = null;

      try {
        if (!allowGeneration) {
          const existing = await findCompletedEntityImage(
            entityType,
            entityId,
            entityVersion,
            theme
          );
          if (existing?.blobUrl) {
            span.setAttributes({
              "cache.hit": true,
              "blob.url": existing.blobUrl,
              "generation.allowed": false,
            });
            span.setStatus({ code: SpanStatusCode.OK });
            return existing.blobUrl;
          }

          span.setAttributes({
            "cache.hit": false,
            "generation.allowed": false,
            "generation.denied": true,
          });
          throw new ImageGenerationDeniedError();
        }

        // Try to claim generation or get existing result
        claim = await claimImageGeneration(
          entityType,
          entityId,
          entityVersion,
          theme
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

          span.setAttributes({ "generation.in_progress": true });
          throw new ImageRendererUnavailableError(
            "Image generation is already in progress"
          );
        }

        // We claimed generation, now actually generate the image
        span.setAttributes({ "generation.claimed": true });

        const imageBuffer = await generateImage({
          baseUrl,
          entityId,
          entityUrlPath,
          entityType,
          theme,
        });

        // Upload to blob storage
        const filename = generateEntityImagePath(
          entityType,
          entityId,
          theme,
          `${entityVersion}-${claim.generationToken}`
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
        await completeImageGeneration(
          claim.id,
          claim.generationToken,
          entityVersion,
          blobResult.url
        );

        span.setStatus({ code: 1 }); // OK
        return blobResult.url;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        if (error instanceof ImageGenerationDeniedError) {
          span.setAttribute("generation.denied", true);
          span.setStatus({ code: SpanStatusCode.OK });
          throw error;
        }

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
            await failImageGeneration(
              claim.id,
              claim.generationToken,
              entityVersion,
              errorMessage
            );
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
