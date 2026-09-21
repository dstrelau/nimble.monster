import { trace } from "@opentelemetry/api";
import type { NextRequest } from "next/server";
import type { EntityImageTheme } from "@/lib/db/schema";
import { getEntityImageVersion } from "@/lib/entity-image-version";
import {
  generateEntityImageWithStorage,
  ImageGenerationDeniedError,
  ImageRendererUnavailableError,
} from "@/lib/image-generation";
import { getCompanionUrl, getItemUrl, getMonsterUrl } from "./utils/url";

type Entity = {
  id: string;
  name: string;
  updatedAt: Date | string;
};

type EntityType = "monster" | "companion" | "item";

const IMAGE_PREVIEW_BOT_USER_AGENTS = [
  /Discordbot/i,
  /facebookexternalhit/i,
  /LinkedInBot/i,
  /Slackbot-LinkExpanding/i,
  /Twitterbot/i,
];

function canGenerateEntityImage(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const userAgent = request.headers.get("user-agent") ?? "";
  if (
    IMAGE_PREVIEW_BOT_USER_AGENTS.some((pattern) => pattern.test(userAgent))
  ) {
    return true;
  }

  if (request.headers.get("sec-fetch-site") !== "same-origin") return false;

  const referer = request.headers.get("referer");
  const requestHost = request.headers.get("host");
  if (!referer || !requestHost) return false;

  try {
    return new URL(referer).host === requestHost;
  } catch {
    return false;
  }
}

export function parseThemeParam(request: NextRequest): EntityImageTheme {
  const raw = new URL(request.url).searchParams.get("theme");
  if (raw === "dark") return raw;
  return "light";
}

export async function createImageResponse(
  request: NextRequest,
  entity: Entity,
  entityType: EntityType
): Promise<Response> {
  const tracer = trace.getTracer("image-route-handler");

  return tracer.startActiveSpan(`create-${entityType}-image`, async (span) => {
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = new URL(request.url).protocol;
    const baseUrl = `${protocol}//${host}`;
    const theme = parseThemeParam(request);
    const allowGeneration = canGenerateEntityImage(request);

    span.setAttributes({
      "entity.id": entity.id,
      "entity.type": entityType,
      "entity.name": entity.name,
      "entity.theme": theme,
      "request.host": host,
      "request.protocol": protocol,
      "generation.allowed": allowGeneration,
    });

    try {
      const version = getEntityImageVersion(entity);
      const etag = `"${version}-${theme}"`;

      span.setAttributes({
        "entity.version": version,
        "response.etag": etag,
      });

      const ifNoneMatch = request.headers.get("if-none-match");
      if (ifNoneMatch === etag) {
        span.setAttributes({
          "cache.hit": true,
          "response.status": 304,
        });
        span.setStatus({ code: 1 }); // OK
        return new Response(null, { status: 304 });
      }

      span.setAttributes({ "cache.hit": false });

      const startTime = Date.now();

      const entityUrlPath = (() => {
        switch (entityType) {
          case "monster":
            return getMonsterUrl(entity);
          case "item":
            return getItemUrl(entity);
          case "companion":
            return getCompanionUrl(entity);
          default:
            throw new Error(`Unsupported entity type: ${entityType}`);
        }
      })();

      // Use blob storage for image generation
      const blobUrl = await generateEntityImageWithStorage({
        allowGeneration,
        baseUrl,
        entityId: entity.id,
        entityUrlPath,
        entityType,
        entityVersion: version,
        theme,
      });

      const generationTime = Date.now() - startTime;

      span.setAttributes({
        "image.generation_time_ms": generationTime,
        "blob.url": blobUrl,
        "response.status": 302,
        "redirect.target": blobUrl,
      });

      span.setStatus({ code: 1 }); // OK

      // For local development, redirect to static file in public/
      // For production, redirect to Vercel blob URL directly
      const isLocal = blobUrl.startsWith("/blob-storage/");

      if (isLocal) {
        // Local development - redirect to static file
        return Response.redirect(new URL(blobUrl, baseUrl).toString(), 302);
      }

      // Production - redirect directly to Vercel blob URL
      return new Response(null, {
        status: 302,
        headers: {
          Location: blobUrl,
          ETag: etag,
          "Cache-Control": "public, max-age=30, must-revalidate",
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const rendererUnavailable =
        error instanceof ImageRendererUnavailableError;
      const generationDenied = error instanceof ImageGenerationDeniedError;
      const responseStatus = generationDenied
        ? 403
        : rendererUnavailable
          ? 503
          : 500;

      span.setAttributes({
        ...(generationDenied
          ? { "generation.denied": true }
          : {
              "error.message": errorMessage,
              "error.type":
                error instanceof Error ? error.constructor.name : "Unknown",
            }),
        "response.status": responseStatus,
      });

      if (errorStack && !generationDenied) {
        span.setAttributes({ "error.stack": errorStack });
      }

      span.setStatus(
        generationDenied ? { code: 1 } : { code: 2, message: errorMessage }
      );

      if (!generationDenied) {
        console.error(
          `Error generating ${entityType} image for ${entity.id}:`,
          {
            entityId: entity.id,
            entityType,
            entityName: entity.name,
            host,
            error: errorMessage,
            stack: errorStack,
          }
        );
      }

      return new Response(
        generationDenied
          ? "Image generation is not permitted"
          : `Error generating image: ${errorMessage}`,
        {
          status: responseStatus,
          headers: generationDenied
            ? { "Cache-Control": "no-store" }
            : rendererUnavailable
              ? { "Retry-After": "5", "Cache-Control": "no-store" }
              : undefined,
        }
      );
    } finally {
      span.end();
    }
  });
}
