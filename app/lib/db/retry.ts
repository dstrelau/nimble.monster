import type { PrismaClient } from "@/lib/prisma";
import { trace } from "@opentelemetry/api";

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 4,
  baseDelay: 100,
  maxDelay: 2000,
  jitterFactor: 0.1,
};

function isRetryableError(error: unknown): boolean {
  if (typeof error !== "object" || !error) return false;

  const errorMessage = "message" in error ? String(error.message) : "";

  return (
    errorMessage.includes("Can't reach database server") ||
    errorMessage.includes("Server has closed the connection") ||
    errorMessage.includes("the database system is starting up") ||
    errorMessage.includes("Connection terminated unexpectedly") ||
    errorMessage.includes("connection refused") ||
    errorMessage.includes("timeout expired")
  );
}

function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.baseDelay * 2 ** attempt;
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  const jitter = cappedDelay * options.jitterFactor * Math.random();
  return cappedDelay + jitter;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createRetryWrapper(
  prisma: PrismaClient,
  options: RetryOptions = defaultRetryOptions,
) {
  const handler: ProxyHandler<PrismaClient> = {
    get(target, prop) {
      const originalProperty = target[prop as keyof PrismaClient];

      if (typeof originalProperty === "object" && originalProperty !== null) {
        return new Proxy(originalProperty, {
          get(modelTarget, modelProp) {
            const originalMethod = (
              modelTarget as Record<string | symbol, unknown>
            )[modelProp];

            if (typeof originalMethod === "function") {
              return async (...args: unknown[]) => {
                const span = trace.getActiveSpan();
                let lastError: unknown;

                for (
                  let attempt = 0;
                  attempt <= options.maxRetries;
                  attempt++
                ) {
                  try {
                    if (attempt > 0 && span) {
                      span.setAttributes({
                        "db.retry.attempt": attempt,
                        "db.retry.operation": `${String(prop)}.${String(modelProp)}`,
                      });
                    }

                    return await originalMethod.apply(modelTarget, args);
                  } catch (error) {
                    lastError = error;

                    if (
                      attempt === options.maxRetries ||
                      !isRetryableError(error)
                    ) {
                      if (span) {
                        span.setAttributes({
                          "db.retry.failed_after_attempts": attempt + 1,
                          "db.retry.final_error":
                            error instanceof Error
                              ? error.message
                              : String(error),
                        });
                      }
                      throw error;
                    }

                    const delay = calculateDelay(attempt, options);

                    if (span) {
                      span.setAttributes({
                        "db.retry.will_retry": true,
                        "db.retry.delay_ms": delay,
                        "db.retry.error":
                          error instanceof Error
                            ? error.message
                            : String(error),
                      });
                    }

                    await sleep(delay);
                  }
                }

                throw lastError;
              };
            }

            return originalMethod;
          },
        });
      }

      return originalProperty;
    },
  };

  return new Proxy(prisma, handler);
}
