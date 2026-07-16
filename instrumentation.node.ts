import { migrate } from "drizzle-orm/libsql/migrator";
import { getDatabase } from "@/lib/db/drizzle";

await migrate(getDatabase(), { migrationsFolder: "./migrations" });

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK, tracing } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const HONEYCOMB_API_KEY = process.env.HONEYCOMB_API_KEY ?? "";

const useHoneycomb = !!HONEYCOMB_API_KEY;
const otelHost = useHoneycomb
  ? "https://api.honeycomb.io"
  : "http://localhost:4318";
const traceEndpoint = `${otelHost}/v1/traces`;

console.log(
  `OpenTelemetry exporting to: ${useHoneycomb ? "Honeycomb.io" : "localhost:4318"}`
);

const traceExporter = new OTLPTraceExporter({
  url: traceEndpoint,
  headers: { "x-honeycomb-team": HONEYCOMB_API_KEY },
});

const CAPTURED_REQUEST_HEADERS = [
  "host",
  "origin",
  "referer",
  "content-type",
  "content-length",
  "next-action",
  "accept",
  "accept-language",
] as const;

const httpInstrumentation = new HttpInstrumentation({
  requestHook: (span, request) => {
    for (const name of CAPTURED_REQUEST_HEADERS) {
      let value: string | undefined;
      if ("headers" in request && request.headers) {
        const raw = request.headers[name];
        if (raw) value = Array.isArray(raw) ? raw.join(", ") : raw;
      } else if ("getHeader" in request) {
        const raw = request.getHeader(name);
        if (raw) value = Array.isArray(raw) ? raw.join(", ") : String(raw);
      }
      if (value) {
        span.setAttribute(`http.request.header.${name}`, value);
      }
    }
  },
});

// Drop traces for the /api/build-id poll; ParentBasedSampler drops all child
// spans (middleware, route execution, etc.) along with the root.
const dropBuildIdSampler: tracing.Sampler = {
  shouldSample(_context, _traceId, _spanName, _spanKind, attributes) {
    const target = attributes["http.target"];
    return {
      decision:
        typeof target === "string" && target.startsWith("/api/build-id")
          ? tracing.SamplingDecision.NOT_RECORD
          : tracing.SamplingDecision.RECORD_AND_SAMPLED,
    };
  },
  toString: () => "DropBuildIdSampler",
};

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "nimble.monster",
  }),
  sampler: new tracing.ParentBasedSampler({ root: dropBuildIdSampler }),
  traceExporter,
  instrumentations: [httpInstrumentation],
});

const shutdownHandler = async () => {
  try {
    const { closeBrowser } = await import("@/lib/browser");
    await closeBrowser();
  } catch (error) {
    console.error("Error closing browser:", error);
  }
  sdk
    .shutdown()
    .catch((error) =>
      console.error("Error shutting down OpenTelemetry SDK", error)
    )
    .finally(() => process.exit(0));
};

process.on("SIGTERM", shutdownHandler);
process.on("SIGINT", shutdownHandler);

sdk.start();

import("@/lib/browser").then(({ getBrowser }) => {
  getBrowser().catch((error) =>
    console.error("Failed to pre-warm browser:", error)
  );
});
