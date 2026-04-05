import fs from "node:fs";
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
 * Check if an error is a WAL conflict (corrupted local replica).
 * This happens when the local SQLite WAL diverges from the remote Turso DB,
 * e.g. after a Fly.io machine suspend/resume cycle.
 */
function isWalConflictError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message || "";
  const causeMessage =
    error.cause instanceof Error ? error.cause.message : String(error.cause);
  return (
    message.includes("WAL frame") ||
    message.includes("FrameConflict") ||
    message.includes("InvalidPushFrame") ||
    causeMessage.includes("WAL frame") ||
    causeMessage.includes("FrameConflict") ||
    causeMessage.includes("InvalidPushFrame")
  );
}

/**
 * Delete the local replica files so the next client recreates them from remote.
 */
function deleteLocalReplica(): void {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  if (!url?.startsWith("file:")) return;

  const dbPath = url.slice("file:".length);
  for (const suffix of ["", "-wal", "-shm"]) {
    const filePath = `${dbPath}${suffix}`;
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File may not exist, that's fine
    }
  }
}

/**
 * Creates the raw libsql client.
 * Uses a 60s sync interval to limit quota usage while keeping data reasonably fresh.
 * Starts a periodic checkpoint to compact the WAL, since auto-checkpoint is disabled
 * for sync databases (see https://docs.turso.tech/sync/checkpoint).
 */
function createRawClient(): Client {
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const client = createClient({
    url,
    syncUrl: process.env.DATABASE_SYNC_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
    syncInterval: process.env.DATABASE_SYNC_URL ? 60 : undefined,
  });

  if (process.env.DATABASE_SYNC_URL) {
    const CHECKPOINT_INTERVAL_MS = 5 * 60 * 1000;
    setInterval(() => {
      client
        .execute("PRAGMA wal_checkpoint(TRUNCATE)")
        .catch((err: unknown) => {
          console.error("libsql: WAL checkpoint failed", err);
        });
    }, CHECKPOINT_INTERVAL_MS);
  }

  return client;
}

/**
 * Checkpoint the WAL to reclaim disk space.
 * Auto-checkpoint is disabled for sync databases, so this must be called
 * explicitly after bulk writes (e.g. admin imports).
 */
export async function checkpoint(): Promise<void> {
  const client = getRawClient();
  await client.execute("PRAGMA wal_checkpoint(TRUNCATE)");
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
 * Handle a WAL conflict by deleting the corrupted local replica and
 * recreating the client. The new client will re-sync from remote.
 */
function handleWalConflict(): void {
  console.error(
    "libsql: WAL conflict detected, deleting local replica and recreating client"
  );
  resetClient();
  deleteLocalReplica();
}

/**
 * Get the database client with automatic retry on stale connection errors.
 *
 * This client automatically detects Hrana "stream not found" errors (which occur
 * when Turso expires a connection but the client doesn't know) and retries once
 * with a fresh connection.
 *
 * It also detects WAL frame conflicts (which occur when the local replica diverges
 * from remote, e.g. after a Fly.io machine suspend/resume) and recovers by deleting
 * the local replica and recreating the client.
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
            if (isWalConflictError(error)) {
              handleWalConflict();
              const freshClient = getRawClient();
              const freshMethod = freshClient[
                prop as keyof Client
              ] as AsyncMethod;
              return await freshMethod.apply(freshClient, args);
            }
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
