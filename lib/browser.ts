import { SpanStatusCode, trace } from "@opentelemetry/api";
import puppeteer, { type Browser } from "puppeteer-core";

const BROWSER_LAUNCH_TIMEOUT_MS = 10_000;
const BROWSER_PROTOCOL_TIMEOUT_MS = 30_000;

async function launchBrowser(): Promise<Browser> {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

  return puppeteer.launch({
    executablePath,
    headless: true,
    timeout: BROWSER_LAUNCH_TIMEOUT_MS,
    protocolTimeout: BROWSER_PROTOCOL_TIMEOUT_MS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

export async function withBrowser<T>(
  render: (browser: Browser) => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer("entity-image-renderer");
  return tracer.startActiveSpan("browser.session", async (span) => {
    let browser: Browser | null = null;
    let phase = "launch";
    let outcome: { ok: true; value: T } | { error: unknown; ok: false };

    try {
      const launchStartedAt = performance.now();
      browser = await launchBrowser();
      span.setAttribute(
        "browser.launch.duration_ms",
        performance.now() - launchStartedAt
      );

      phase = "render";
      const value = await render(browser);
      span.setStatus({ code: SpanStatusCode.OK });
      outcome = { ok: true, value };
    } catch (error) {
      span.setAttributes({
        "browser.error.phase": phase,
        "error.type":
          error instanceof Error ? error.constructor.name : "Unknown",
      });
      span.setStatus({ code: SpanStatusCode.ERROR });
      outcome = { error, ok: false };
    }

    if (browser) {
      const closeStartedAt = performance.now();
      try {
        await browser.close();
        span.setAttribute(
          "browser.close.duration_ms",
          performance.now() - closeStartedAt
        );
      } catch (error) {
        span.setAttributes({
          "browser.error.phase": "close",
          "error.type":
            error instanceof Error ? error.constructor.name : "Unknown",
        });
        span.setStatus({ code: SpanStatusCode.ERROR });
        if (outcome.ok) {
          outcome = { error, ok: false };
        }
      }
    }

    span.end();
    if (!outcome.ok) throw outcome.error;
    return outcome.value;
  });
}
