const { trace } = require("@opentelemetry/api");

let initialized = false;

function initTelemetry() {
  if (initialized) return;

  // Skip OpenTelemetry setup if environment not configured
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log("OpenTelemetry not configured, skipping");
    initialized = true;
    return;
  }

  try {
    const { NodeSDK } = require("@opentelemetry/sdk-node");
    const {
      getNodeAutoInstrumentations,
    } = require("@opentelemetry/auto-instrumentations-node");
    const { Resource } = require("@opentelemetry/resources");
    const {
      SEMRESATTRS_SERVICE_NAME,
    } = require("@opentelemetry/semantic-conventions");
    const {
      OTLPTraceExporter,
    } = require("@opentelemetry/exporter-trace-otlp-http");

    const resource = Resource.default({
      [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "imgen",
    });

    const traceExporter = new OTLPTraceExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    });

    const sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    console.log("OpenTelemetry initialized");
  } catch (error) {
    console.warn("Failed to initialize OpenTelemetry:", error.message);
  }

  initialized = true;
}

function telemetryMiddleware(req, res, next) {
  const tracer = trace.getTracer("imgen-server");

  tracer.startActiveSpan(`${req.method} ${req.path}`, (span) => {
    span.setAttributes({
      "http.method": req.method,
      "http.url": req.url,
      "http.path": req.path,
      "http.user_agent": req.get("User-Agent") || "",
    });

    res.on("finish", () => {
      span.setAttributes({
        "http.status_code": res.statusCode,
        "http.response_size": res.get("Content-Length") || 0,
      });

      if (res.statusCode >= 400) {
        span.setStatus({ code: 2, message: `HTTP ${res.statusCode}` });
      } else {
        span.setStatus({ code: 1 });
      }

      span.end();
    });

    next();
  });
}

module.exports = {
  initTelemetry,
  telemetryMiddleware,
};
