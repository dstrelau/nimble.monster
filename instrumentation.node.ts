import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
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

const httpInstrumentation = new HttpInstrumentation({
  requestHook: (span, request) => {
    // For IncomingMessage (server requests), headers is directly available
    // For ClientRequest (client requests), getHeader method is used
    if ("headers" in request && request.headers && request.headers.host) {
      span.setAttribute("http.request.header.host", request.headers.host);
    } else if ("getHeader" in request) {
      const host = request.getHeader("host");
      if (host) {
        span.setAttribute("http.request.header.host", host.toString());
      }
    }
  },
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "nimble.monster",
  }),
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
