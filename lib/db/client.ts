import { type Client, createClient } from "@libsql/client";

let client: Client | null = null;

export function getClient(): Client {
  if (client) {
    return client;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  client = createClient({
    url,
    syncUrl: process.env.DATABASE_SYNC_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    syncInterval: process.env.DATABASE_SYNC_URL ? 10 : undefined,
  });

  return client;
}
