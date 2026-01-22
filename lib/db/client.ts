import { type Client, createClient } from "@libsql/client";

let client: Client | null = null;

export function getClient(): Client {
  if (client) {
    return client;
  }

  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("TURSO_DATABASE_URL or DATABASE_URL is required");
  }

  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return client;
}
