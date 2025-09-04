import { trace } from "@opentelemetry/api";
import type { NextRequest } from "next/server";
import { generateEntityImage } from "@/lib/image-generation";

type Entity = {
  id: string;
  name: string;
  updatedAt: Date | string;
};

type EntityType = "monster" | "companion" | "item";

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

    span.setAttributes({
      "entity.id": entity.id,
      "entity.type": entityType,
      "entity.name": entity.name,
      "request.host": host,
      "request.protocol": protocol,
    });

    try {
      const version = new Date(entity.updatedAt).getTime().toString();
      const etag = `"${version}"`;

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
      const imageBuffer = await generateEntityImage({
        baseUrl,
        entityId: entity.id,
        entityType,
      });
      const generationTime = Date.now() - startTime;

      span.setAttributes({
        "image.generation_time_ms": generationTime,
        "image.buffer_size": imageBuffer.length,
        "response.status": 200,
      });

      span.setStatus({ code: 1 }); // OK
      return new Response(imageBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `inline; filename="${entity.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.png"`,
          ETag: etag,
          "Cache-Control": "public, max-age=30, must-revalidate",
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      span.setAttributes({
        "error.message": errorMessage,
        "error.type":
          error instanceof Error ? error.constructor.name : "Unknown",
        "response.status": 500,
      });

      if (errorStack) {
        span.setAttributes({ "error.stack": errorStack });
      }

      span.setStatus({ code: 2, message: errorMessage }); // ERROR

      console.error(`Error generating ${entityType} image for ${entity.id}:`, {
        entityId: entity.id,
        entityType,
        entityName: entity.name,
        host,
        error: errorMessage,
        stack: errorStack,
      });

      return new Response(`Error generating image: ${errorMessage}`, {
        status: 500,
      });
    } finally {
      span.end();
    }
  });
}
