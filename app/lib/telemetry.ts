import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";

function isRetryableDbError(error: unknown): boolean {
  if (typeof error !== 'object' || !error) return false;
  
  const errorMessage = 'message' in error ? String(error.message) : '';
  
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
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const activeSpan = trace.getActiveSpan();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (activeSpan) {
        if (error instanceof Error) {
          activeSpan.recordException(error);
        }

        activeSpan.setAttributes({
          "exception.message": errorMessage,
          "exception.retryable": isRetryableDbError(error),
        });
      }

      return NextResponse.json({ error: "Unknown Error" }, { status: 500 });
    }
  };
}
