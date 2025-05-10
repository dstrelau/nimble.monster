import { resourceFromAttributes } from "@opentelemetry/resources";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";

const HONEYCOMB_API_KEY = process.env.HONEYCOMB_API_KEY ?? "";
const HONEYCOMB_DATASET = process.env.HONEYCOMB_DATASET ?? "nimble.monster";

const useHoneycomb = !!HONEYCOMB_API_KEY;
const otelHost = useHoneycomb
  ? "https://api.honeycomb.io"
  : "http://localhost:4318";
const traceEndpoint = `${otelHost}/v1/traces`;
const metricEndpoint = `${otelHost}/v1/metrics`;

console.log(
  `OpenTelemetry exporting to: ${useHoneycomb ? "Honeycomb.io" : "localhost:4318"}`,
);

const traceExporter = new OTLPTraceExporter({
  url: traceEndpoint,
  headers: { "x-honeycomb-team": HONEYCOMB_API_KEY },
});

const metricExporter = new OTLPMetricExporter({
  url: metricEndpoint,
  headers: {
    "x-honeycomb-team": HONEYCOMB_API_KEY,
    "x-honeycomb-dataset": HONEYCOMB_DATASET,
  },
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "nimble.monster",
  }),
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
  }),
});

const shutdownHandler = () => {
  sdk
    .shutdown()
    .catch((error) =>
      console.error("Error shutting down OpenTelemetry SDK", error),
    )
    .finally(() => process.exit(0));
};

process.on("SIGTERM", shutdownHandler);
process.on("SIGINT", shutdownHandler);

sdk.start();
