import { trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";

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
        });
      }

      return NextResponse.json({ error: "Unknown Error" }, { status: 500 });
    }
  };
}
