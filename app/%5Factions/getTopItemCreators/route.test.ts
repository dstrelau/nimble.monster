import { createClient } from "@libsql/client";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });

beforeAll(async () => {
  await client.execute(`CREATE TABLE users (
    id text, discord_id text, username text, display_name text, avatar text,
    image_url text, refresh_token text, role text, name text, email text,
    email_verified integer, banner_dismissed integer, created_at text, updated_at text
  )`);
  await client.execute(
    "CREATE TABLE items(id text, user_id text, visibility text)"
  );
});
beforeEach(async () => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
  await client.execute("DELETE FROM items");
  await client.execute("DELETE FROM users");
});
afterAll(() => client.close());

it("returns ten creators ranked by public item count without exposing private user fields", async () => {
  // Distinct counts detect private inclusion, wrong ordering and limit regressions.
  for (let index = 0; index < 12; index++) {
    await client.execute({
      sql: `INSERT INTO users(id, discord_id, username, display_name, image_url, email, refresh_token, role)
        VALUES(?,?,?,?,?,'private@example.test','secret','admin')`,
      args: [
        `u${index}`,
        `d${index}`,
        `user${index}`,
        `Creator ${index}`,
        `https://example.test/${index}.png`,
      ],
    });
    for (let row = 0; row < index; row++) {
      await client.execute({
        sql: "INSERT INTO items VALUES(?,?,?)",
        args: [`i${index}-${row}`, `u${index}`, "public"],
      });
    }
  }
  for (let row = 0; row < 20; row++) {
    await client.execute({
      sql: "INSERT INTO items VALUES(?,?,?)",
      args: [`private${row}`, "u0", "private"],
    });
  }
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual(
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((index) => ({
      id: `u${index}`,
      discordId: `d${index}`,
      username: `user${index}`,
      displayName: `Creator ${index}`,
      imageUrl: `https://example.test/${index}.png`,
    }))
  );
});

it("returns an empty array without public items", async () => {
  expect(await (await GET()).json()).toEqual([]);
});

it("records unexpected failures without leaking database details", async () => {
  const span = trace.getTracer("test").startSpan("item-creators");
  const recordException = vi.spyOn(span, "recordException");
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  getDatabase.mockImplementationOnce(() => {
    throw new Error("private SQL path");
  });
  const response = await GET();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(recordException).toHaveBeenCalledWith(new Error("private SQL path"));
});
