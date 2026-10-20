import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";
import type { NextResponse } from "next/server";

export function recordError(span: Span, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message });

  // Drizzle/fetch use Error.cause; Auth.js wraps its original error in cause.err.
  // Keep only error diagnostics, not provider metadata, headers, or bodies.
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== undefined; depth++) {
    const prefix = depth === 0 ? "error" : `error.cause.${depth}`;
    span.setAttributes({
      [`${prefix}.type`]:
        current instanceof Error ? current.name : typeof current,
      [`${prefix}.message`]:
        current instanceof Error ? current.message : String(current),
    });
    if (current instanceof Error) span.recordException(current);
    if (typeof current !== "object" || current === null) break;
    if ("code" in current && typeof current.code === "string") {
      span.setAttribute(`${prefix}.code`, current.code);
    }
    current = "cause" in current ? current.cause : undefined;
    if (typeof current === "object" && current !== null && "err" in current) {
      current = current.err;
    }
  }
}

function isRetryableDbError(error: unknown): boolean {
  if (typeof error !== "object" || !error) return false;

  const errorMessage = "message" in error ? String(error.message) : "";

  return (
    errorMessage.includes("Can't reach database server") ||
    errorMessage.includes("Server has closed the connection") ||
    errorMessage.includes("the database system is starting up") ||
    errorMessage.includes("Connection terminated unexpectedly") ||
    errorMessage.includes("connection refused") ||
    errorMessage.includes("timeout expired")
  );
}

export function telemetry<T extends readonly unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const activeSpan = trace.getActiveSpan();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (activeSpan) {
        recordError(activeSpan, error);

        activeSpan.setAttributes({
          "exception.message": errorMessage,
          "exception.retryable": isRetryableDbError(error),
        });
      }

      throw error;
    }
  };
}
