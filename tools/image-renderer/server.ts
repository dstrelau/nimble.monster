import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { SpanStatusCode } from "@opentelemetry/api";
import { z } from "zod";
import { withBrowser } from "../../lib/browser";
import {
  type EntityImageRenderOptions,
  renderEntityImage,
} from "../../lib/entity-image-renderer";
import { RenderQueue, RenderQueueFullError } from "./queue";
import {
  extractTraceContext,
  flushTelemetry,
  rendererTracer,
  setMemoryAttributes,
} from "./telemetry";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Image renderer environment is missing ${name}`);
  }
  return value;
}

const sourceUrl = requireEnvironmentVariable("IMAGE_RENDER_SOURCE_URL");
const rendererSecret = requireEnvironmentVariable("IMAGE_RENDERER_SECRET");
const parsedSourceUrl = new URL(sourceUrl);
if (parsedSourceUrl.protocol !== "https:") {
  throw new Error("Image renderer source URL must use HTTPS");
}
const sourceOrigin = parsedSourceUrl.origin;
const renderQueue = new RenderQueue(8);

const renderRequestSchema = z
  .object({
    entityId: z.string().min(1).max(200),
    entityUrlPath: z.string().min(1).max(500),
    entityType: z.enum(["monster", "companion", "item"]),
    theme: z.enum(["light", "dark"]),
  })
  .strict();

function secretsMatch(provided: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(rendererSecret);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

function parseRequest(value: unknown): EntityImageRenderOptions | null {
  const parsed = renderRequestSchema.safeParse(value);
  if (!parsed.success) return null;
  const request = parsed.data;
  const { entityId, entityUrlPath, entityType, theme } = request;

  const validPrefixes: Record<typeof entityType, readonly string[]> = {
    monster: ["/monsters/", "/hazards/"],
    companion: ["/companions/"],
    item: ["/items/"],
  };
  if (
    !validPrefixes[entityType].some(
      (prefix) =>
        entityUrlPath.startsWith(prefix) &&
        entityUrlPath.length > prefix.length &&
        !entityUrlPath.slice(prefix.length).includes("/") &&
        !entityUrlPath.includes("?") &&
        !entityUrlPath.includes("#")
    )
  ) {
    return null;
  }

  return {
    baseUrl: sourceOrigin,
    entityId,
    entityUrlPath,
    entityType,
    theme,
  };
}

createServer(async (request, response) => {
  const isHealthRequest = request.method === "GET" && request.url === "/health";
  const isRenderRequest = request.method === "POST" && request.url === "/render";
  if (!isHealthRequest && !isRenderRequest) {
    response.writeHead(404).end();
    return;
  }
  const providedSecret = request.headers["x-image-renderer-secret"];
  if (typeof providedSecret !== "string" || !secretsMatch(providedSecret)) {
    response.writeHead(401).end();
    return;
  }
  if (isHealthRequest) {
    await rendererTracer.startActiveSpan(
      "image-renderer.health",
      {},
      extractTraceContext(request.headers),
      async (span) => {
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        await flushTelemetry();
        response.writeHead(204, { "Cache-Control": "no-store" }).end();
      }
    );
    return;
  }
  const chunks: Buffer[] = [];
  let bodyBytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    bodyBytes += buffer.byteLength;
    if (bodyBytes > 16 * 1024) {
      response.writeHead(413).end();
      return;
    }
    chunks.push(buffer);
  }

  let options: EntityImageRenderOptions | null = null;
  try {
    options = parseRequest(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch {
    options = null;
  }
  if (!options) {
    response.writeHead(400).end();
    return;
  }

  await rendererTracer.startActiveSpan(
    "image-renderer.render",
    {
      attributes: {
        "renderer.entity.type": options.entityType,
        "renderer.theme": options.theme,
        "renderer.queue.size": renderQueue.size,
        "renderer.queue.capacity": 8,
      },
    },
    extractTraceContext(request.headers),
    async (span) => {
      const queuedAt = performance.now();
      let responseBody: Buffer | undefined;
      let responseHeaders: Record<string, string | number> = {};
      let responseStatus = 500;
      await setMemoryAttributes(span, "start");
      try {
        const image = await renderQueue.run(async () => {
          span.setAttribute(
            "renderer.queue.wait_ms",
            performance.now() - queuedAt
          );
          return withBrowser((browser) => renderEntityImage(options, browser));
        });
        span.setAttributes({
          "renderer.output.bytes": image.byteLength,
          "renderer.outcome": "success",
        });
        span.setStatus({ code: SpanStatusCode.OK });
        responseStatus = 200;
        responseHeaders = {
          "Content-Type": "image/png",
          "Content-Length": image.byteLength,
          "Cache-Control": "no-store",
        };
        responseBody = image;
      } catch (error) {
        if (error instanceof RenderQueueFullError) {
          span.setAttribute("renderer.outcome", "queue_full");
          responseStatus = 503;
          responseHeaders = { "Retry-After": "10" };
        } else {
          span.setAttributes({
            "renderer.outcome": "render_error",
            "error.type":
              error instanceof Error ? error.constructor.name : "Unknown",
          });
        }
        span.setStatus({ code: SpanStatusCode.ERROR });
      } finally {
        await setMemoryAttributes(span, "end");
        span.end();
        await flushTelemetry();
      }
      response.writeHead(responseStatus, responseHeaders).end(responseBody);
    }
  );
}).listen(8080, "0.0.0.0");
