import { type Client, createClient } from "@libsql/client";

let rawClient: Client | null = null;

/**
 * Check if an error is a Hrana stream error (stale connection).
 * These errors occur when Turso expires the connection but the client doesn't know.
 */
function isHranaStreamError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message || "";
  const causeMessage =
    error.cause instanceof Error ? error.cause.message : String(error.cause);
  return (
    message.includes("stream not found") ||
    message.includes("Hrana") ||
    causeMessage.includes("stream not found") ||
    causeMessage.includes("Hrana")
  );
}

/**
 * Creates the raw libsql client.
 */
function createRawClient(): Client {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  return createClient({
    url,
    syncUrl: process.env.DATABASE_SYNC_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    syncInterval: process.env.DATABASE_SYNC_URL ? 10 : undefined,
  });
}

/**
 * Reset the database client, forcing a new connection on next use.
 */
function resetClient(): void {
  rawClient = null;
}

/**
 * Get or create the raw client.
 */
function getRawClient(): Client {
  if (!rawClient) {
    rawClient = createRawClient();
  }
  return rawClient;
}

/**
 * Get the database client with automatic retry on stale connection errors.
 *
 * This client automatically detects Hrana "stream not found" errors (which occur
 * when Turso expires a connection but the client doesn't know) and retries once
 * with a fresh connection.
 *
 * All async methods (execute, batch, migrate, transaction, executeMultiple, sync)
 * are wrapped to retry once if a stale connection error occurs.
 *
 * Note: The Transaction object returned by transaction() is NOT wrapped.
 * If an operation fails mid-transaction due to a Hrana error, the transaction
 * is invalid and the caller must retry their entire transaction logic.
 */
export function getClient(): Client {
  // Return a proxy that always gets the current client and wraps methods with retry logic
  return new Proxy({} as Client, {
    get(_target, prop: string | symbol) {
      const client = getRawClient();
      const value = client[prop as keyof Client];

      // For non-function properties, return directly
      if (typeof value !== "function") {
        return value;
      }

      // Methods that should be wrapped with retry logic
      const retryMethods = [
        "execute",
        "batch",
        "migrate",
        "transaction",
        "executeMultiple",
        "sync",
      ];

      if (retryMethods.includes(prop as string)) {
        // Return a function that retries on Hrana errors
        type AsyncMethod = (...args: unknown[]) => Promise<unknown>;
        const method = value as AsyncMethod;
        return async (...args: unknown[]) => {
          try {
            return await method.apply(client, args);
          } catch (error) {
            if (isHranaStreamError(error)) {
              // Reset and retry with fresh client
              resetClient();
              const freshClient = getRawClient();
              const freshMethod = freshClient[
                prop as keyof Client
              ] as AsyncMethod;
              return await freshMethod.apply(freshClient, args);
            }
            throw error;
          }
        };
      }

      // For other methods (close, etc.), bind to current client
      type SyncMethod = (...args: unknown[]) => unknown;
      return (value as SyncMethod).bind(client);
    },
  });
}
