import { type Client, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import { completeImageGeneration, failImageGeneration } from "./entity-images";

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: vi.fn(),
}));

describe("entity image generation fencing", () => {
  let client: Client;

  beforeEach(async () => {
    client = createClient({ url: "file::memory:" });
    await client.execute(`
      CREATE TABLE entity_images (
        id text PRIMARY KEY NOT NULL,
        entity_type text NOT NULL,
        entity_id text NOT NULL,
        theme text DEFAULT 'light' NOT NULL,
        blob_url text,
        generated_at text,
        entity_version text NOT NULL,
        generation_status text DEFAULT 'generating',
        generation_token text,
        generation_started_at text,
        created_at text,
        updated_at text
      )
    `);
    await client.execute({
      sql: `INSERT INTO entity_images (
        id, entity_type, entity_id, theme, entity_version,
        generation_status, generation_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "image-row",
        "monster",
        "monster-id",
        "light",
        "version-1",
        "generating",
        "attempt-b",
      ],
    });
    vi.mocked(getDatabase).mockReturnValue(drizzle(client));
  });

  afterEach(() => {
    client.close();
    vi.clearAllMocks();
  });

  it("prevents an expired attempt from completing a reclaimed generation", async () => {
    await expect(
      completeImageGeneration(
        "image-row",
        "attempt-a",
        "version-1",
        "https://images.example/stale.png"
      )
    ).rejects.toThrow("Image generation claim is no longer current");

    const result = await client.execute(
      "SELECT generation_status, generation_token, blob_url FROM entity_images"
    );
    expect(result.rows[0]).toMatchObject({
      generation_status: "generating",
      generation_token: "attempt-b",
      blob_url: null,
    });
  });

  it("prevents an expired attempt from failing a reclaimed generation", async () => {
    await expect(
      failImageGeneration("image-row", "attempt-a", "version-1", "late error")
    ).rejects.toThrow("Image generation claim is no longer current");

    const result = await client.execute(
      "SELECT generation_status, generation_token FROM entity_images"
    );
    expect(result.rows[0]).toMatchObject({
      generation_status: "generating",
      generation_token: "attempt-b",
    });
  });

  it("allows the current attempt to complete", async () => {
    await completeImageGeneration(
      "image-row",
      "attempt-b",
      "version-1",
      "https://images.example/current.png"
    );

    const result = await client.execute(
      "SELECT generation_status, blob_url FROM entity_images"
    );
    expect(result.rows[0]).toMatchObject({
      generation_status: "completed",
      blob_url: "https://images.example/current.png",
    });
  });
});
