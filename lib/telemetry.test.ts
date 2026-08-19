import { describe, expect, it, vi } from "vitest";

const { mockActiveSpan } = vi.hoisted(() => ({
  mockActiveSpan: {
    recordException: vi.fn(),
    setAttributes: vi.fn(),
  },
}));

vi.mock("@opentelemetry/api", () => ({
  trace: { getActiveSpan: vi.fn(() => mockActiveSpan) },
}));

import { telemetry } from "./telemetry";

describe("telemetry", () => {
  it("records an unexpected handler exception before rethrowing it", async () => {
    const failure = new Error("database unavailable");
    const handler = telemetry(async () => {
      throw failure;
    });

    await expect(handler()).rejects.toBe(failure);
    expect(mockActiveSpan.recordException).toHaveBeenCalledWith(failure);
    expect(mockActiveSpan.setAttributes).toHaveBeenCalledWith({
      "exception.message": failure.message,
      "exception.retryable": false,
    });
  });
});
