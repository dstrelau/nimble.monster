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
const request = (query: string) =>
  new Request(`http://localhost/_actions/searchCreators?${query}`);

beforeAll(async () => {
  await client.execute(`CREATE TABLE users (
    id text, discord_id text, username text, display_name text, avatar text,
    image_url text, refresh_token text, role text, name text, email text,
    email_verified integer, banner_dismissed integer, created_at text, updated_at text
  )`);
});
beforeEach(async () => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  getDatabase.mockReturnValue(db);
  await client.execute("DELETE FROM users");
});
afterAll(() => client.close());

it("matches display names or usernames, orders and caps at 20 without exposing private user fields", async () => {
  for (let index = 22; index >= 0; index--) {
    await client.execute({
      sql: `INSERT INTO users(id, discord_id, username, display_name, image_url, email, refresh_token, role)
        VALUES(?,?,?,?,?,'private@example.test','secret','admin')`,
      args: [
        `u${index}`,
        `d${index}`,
        `needle${index}`,
        `Creator ${String(index).padStart(2, "0")}`,
        `https://example.test/${index}.png`,
      ],
    });
  }
  // Name-only match sorts before username-only matches; nonmatches stay excluded.
  await client.execute(
    "INSERT INTO users(id,username,display_name) VALUES('name','unrelated','A Needle'),('no','unrelated','Other')"
  );
  const response = await GET(
    request("query=NEEDLE&limit=100&ownerId=no&role=admin")
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual([
    {
      id: "name",
      discordId: "",
      username: "unrelated",
      displayName: "A Needle",
      imageUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
    },
    ...Array.from({ length: 19 }, (_, index) => ({
      id: `u${index}`,
      discordId: `d${index}`,
      username: `needle${index}`,
      displayName: `Creator ${String(index).padStart(2, "0")}`,
      imageUrl: `https://example.test/${index}.png`,
    })),
  ]);
});

it("preserves empty and wildcard search semantics, safely binds special input, and returns empty results", async () => {
  await client.execute(
    "INSERT INTO users(id,username,display_name) VALUES('u','a+b & 雪','Snow')"
  );
  for (const query of ["", "%", "a+b & 雪"]) {
    const response = await GET(
      request(new URLSearchParams({ query }).toString())
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([
      { id: "u", username: "a+b & 雪" },
    ]);
  }
  for (const query of ["missing", "' OR 1=1 --"]) {
    expect(
      await (
        await GET(request(new URLSearchParams({ query }).toString()))
      ).json()
    ).toEqual([]);
  }
  await client.execute("DELETE FROM users");
  expect(await (await GET(request("query="))).json()).toEqual([]);
});

it("rejects a missing query instead of calling SQL", async () => {
  const response = await GET(request("ownerId=u"));
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(getDatabase).not.toHaveBeenCalled();
});

it("records unexpected failures without leaking database details", async () => {
  const recordException = vi.fn();
  vi.spyOn(trace, "getActiveSpan").mockReturnValue({
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
    recordException,
    spanContext: vi.fn(),
    addEvent: vi.fn(),
    addLink: vi.fn(),
    addLinks: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: vi.fn(),
  });
  getDatabase.mockImplementationOnce(() => {
    throw new Error("private SQL path");
  });
  const response = await GET(request("query=a"));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(recordException).toHaveBeenCalled();
});
