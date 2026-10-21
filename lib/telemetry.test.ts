import { SpanStatusCode, trace } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import * as tracing from "@opentelemetry/sdk-trace";
import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { withBrowser } from "./browser";
import { recordError, telemetry } from "./telemetry";

const exporter = new tracing.InMemorySpanExporter();
const processor = new tracing.SimpleSpanProcessor({ exporter });
const sdk = new NodeSDK({
  spanProcessors: [processor],
});

beforeAll(() => sdk.start());
afterEach(() => {
  exporter.reset();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
afterAll(() => sdk.shutdown());

describe("telemetry", () => {
  it.each([false, true])(
    "reports cleanup failures without hiding a render failure (render fails: %s)",
    async (renderFails) => {
      const renderError = new Error("render failed");
      const closeError = new Error("browser close failed");
      vi.spyOn(puppeteer, "launch").mockResolvedValue(
        Object.assign(Object.create(null), {
          close: async () => {
            throw closeError;
          },
        })
      );

      await expect(
        withBrowser(async () => {
          if (renderFails) throw renderError;
          return "image";
        })
      ).rejects.toBe(renderFails ? renderError : closeError);

      await processor.forceFlush();
      const [span] = exporter.getFinishedSpans();
      expect(span.status.code).toBe(SpanStatusCode.ERROR);
      expect(span.attributes).toMatchObject({
        "browser.error.phase": renderFails ? "render" : "close",
        "error.message": renderFails ? renderError.message : closeError.message,
        "browser.close.error.message": closeError.message,
      });
    }
  );

  it("records an unexpected handler exception before rethrowing it", async () => {
    const sqliteError = Object.assign(new Error("database is locked"), {
      code: "SQLITE_BUSY",
    });
    const failure = new Error("Failed query: delete condition links", {
      cause: sqliteError,
    });
    const handler = telemetry(async () => {
      throw failure;
    });

    await trace.getTracer("test").startActiveSpan("handler", async (span) => {
      try {
        await expect(handler()).rejects.toBe(failure);
      } finally {
        span.end();
      }
    });
    await processor.forceFlush();
    const [span] = exporter.getFinishedSpans();
    expect(span.status.code).toBe(SpanStatusCode.ERROR);
    expect(span.attributes).toMatchObject({
      "error.message": failure.message,
      "exception.message": failure.message,
      "error.cause.1.message": "database is locked",
      "error.cause.1.code": "SQLITE_BUSY",
    });
    expect(
      span.events.map((event) => event.attributes?.["exception.message"])
    ).toEqual([failure.message, "database is locked"]);
  });

  it("captures Auth.js causes without exporting provider metadata", async () => {
    const cause = new Error("pkceCodeVerifier cookie was missing");
    const failure = Object.assign(new Error("PKCE value could not be parsed"), {
      name: "InvalidCheck",
      cause: { err: cause, token: "must-not-export" },
    });

    trace.getTracer("test").startActiveSpan("auth.error", (span) => {
      recordError(span, failure);
      span.end();
    });

    await processor.forceFlush();
    const [span] = exporter.getFinishedSpans();
    expect(span.attributes).toMatchObject({
      "error.type": "InvalidCheck",
      "error.cause.1.message": cause.message,
    });
    expect(JSON.stringify(span.attributes)).not.toContain("must-not-export");
    expect(JSON.stringify(span.events)).not.toContain("must-not-export");
  });

  it("records callback failures that Auth.js turns into redirects", async () => {
    vi.stubEnv("AUTH_SECRET", "test-auth-secret");
    vi.stubEnv("AUTH_DISCORD_ID", "test-client");
    vi.stubEnv("AUTH_DISCORD_SECRET", "test-client-secret");
    const { handlers } = await import("./auth");

    const response = await handlers.GET(
      new NextRequest(
        "https://nimble.nexus/api/auth/callback/discord?code=test-oauth-code"
      )
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "https://nimble.nexus/api/auth/error?error=Configuration"
    );
    await processor.forceFlush();
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === "auth.error");
    expect(span?.attributes).toMatchObject({ "error.type": "InvalidCheck" });
    expect(span?.attributes["error.cause.1.message"]).toContain(
      "pkceCodeVerifier cookie was missing"
    );
    const diagnostics = JSON.stringify([span?.attributes, span?.events]);
    expect(diagnostics).not.toContain("test-oauth-code");
    expect(diagnostics).not.toContain("test-client-secret");
  });
});
