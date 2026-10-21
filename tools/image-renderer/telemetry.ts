import { readFile } from "node:fs/promises";
import type { IncomingHttpHeaders } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import {
  propagation,
  ROOT_CONTEXT,
  trace,
  type Context,
  type Span,
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK, tracing } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const honeycombApiKey = process.env.HONEYCOMB_API_KEY;
if (!honeycombApiKey) {
  throw new Error("Image renderer environment is missing HONEYCOMB_API_KEY");
}

const traceExporter = new OTLPTraceExporter({
  url: "https://api.honeycomb.io/v1/traces",
  headers: { "x-honeycomb-team": honeycombApiKey },
});
const spanProcessor = new tracing.SimpleSpanProcessor(traceExporter);
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "nimble.image-renderer",
  }),
  spanProcessors: [spanProcessor],
});
sdk.start();

export const rendererTracer = trace.getTracer("nimble.image-renderer");

export async function flushTelemetry(): Promise<void> {
  const flush = spanProcessor.forceFlush().catch(() => undefined);
  await Promise.race([flush, delay(1_000, undefined, { ref: false })]);
}

export function extractTraceContext(headers: IncomingHttpHeaders): Context {
  const carrier: Record<string, string> = {};
  for (const name of ["traceparent", "tracestate", "baggage"]) {
    const value = headers[name];
    if (typeof value === "string") carrier[name] = value;
  }
  return propagation.extract(ROOT_CONTEXT, carrier);
}

export async function setMemoryAttributes(
  span: Span,
  prefix: "start" | "end"
): Promise<void> {
  const memory = process.memoryUsage();
  span.setAttributes({
    [`process.memory.rss.${prefix}`]: memory.rss,
    [`process.memory.heap_used.${prefix}`]: memory.heapUsed,
  });

  try {
    const cgroupBytes = Number(
      (await readFile("/sys/fs/cgroup/memory.current", "utf8")).trim()
    );
    if (Number.isFinite(cgroupBytes)) {
      span.setAttribute(`system.memory.cgroup.${prefix}`, cgroupBytes);
    }
  } catch {
    // cgroup v2 memory metrics are not available in every development runtime.
  }
}

async function shutdown(): Promise<never> {
  try {
    await sdk.shutdown();
  } finally {
    process.exit(0);
  }
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());
