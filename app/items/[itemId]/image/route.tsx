import { trace } from "@opentelemetry/api";
import type { NextRequest } from "next/server";
import { findItem } from "@/lib/db";
import { createImageResponse } from "@/lib/image-route-handler";
import { isValidUUID } from "@/lib/utils/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const tracer = trace.getTracer("item-image-route");

  return tracer.startActiveSpan("item-image-request", async (span) => {
    try {
      const { itemId } = await params;

      span.setAttributes({
        "item.id": itemId,
        "request.url": request.url,
        "request.method": request.method,
      });

      if (!isValidUUID(itemId)) {
        span.setAttributes({
          "validation.uuid_valid": false,
          "response.status": 404,
        });
        span.setStatus({ code: 1 }); // OK (expected validation failure)
        return new Response("Item not found", { status: 404 });
      }

      span.setAttributes({ "validation.uuid_valid": true });

      const dbStartTime = Date.now();
      const item = await findItem(itemId);
      const dbTime = Date.now() - dbStartTime;

      span.setAttributes({
        "db.query_time_ms": dbTime,
        "item.found": !!item,
        "item.visibility": item?.visibility || "unknown",
      });

      if (!item || item.visibility !== "public") {
        const reason = !item ? "not_found" : "not_public";
        span.setAttributes({
          "response.status": 404,
          "response.reason": reason,
        });
        span.setStatus({ code: 1 }); // OK (expected authorization failure)
        return new Response("Item not found", { status: 404 });
      }

      span.setAttributes({
        "item.name": item.name,
        "item.updated_at": item.updatedAt,
      });

      return createImageResponse(request, item, "item");
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

      console.error("Item image route error:", {
        url: request.url,
        method: request.method,
        error: errorMessage,
        stack: errorStack,
      });

      return new Response("Internal Server Error", { status: 500 });
    } finally {
      span.end();
    }
  });
}
