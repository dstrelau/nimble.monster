import { type Client, createClient } from "@libsql/client";

let client: Client | null = null;

/**
 * Get or create the libsql client.
 *
 * Backed by a plain local SQLite file on the Fly volume; Litestream replicates
 * the WAL to S3 (Tigris) for off-site backup. No remote sync, no retry wrapper.
 */
export function getClient(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is required");
    }
    client = createClient({ url });
  }
  return client;
}

/**
 * Checkpoint the WAL to reclaim disk space. Useful after bulk writes
 * (e.g. admin imports) so the WAL doesn't balloon between Litestream snapshots.
 */
export async function checkpoint(): Promise<void> {
  await getClient().execute("PRAGMA wal_checkpoint(TRUNCATE)");
}
