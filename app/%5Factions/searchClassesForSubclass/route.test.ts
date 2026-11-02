import { createClient } from "@libsql/client";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const { auth, getDatabase } = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const official = "00000000-0000-0000-0000-000000000000";
const read = (query = "") =>
  GET(
    new Request(
      `https://nimble.nexus/_actions/searchClassesForSubclass${query}`
    )
  );

beforeAll(async () => {
  getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: official, discordId: "official", username: "official" },
    {
      id: "owner",
      discordId: "owner-discord",
      username: "owner",
      imageUrl: "https://example.com/owner.png",
      email: "private@example.com",
      refreshToken: "private-token",
    },
    { id: "other", discordId: "other-discord", username: "other" },
  ]);
  await db.insert(schema.classes).values(
    [
      { id: "official", name: "Delta Mage", userId: official },
      { id: "public", name: "Alpha Mage", userId: "other" },
      { id: "owned-public", name: "Zulu Mage", userId: "owner" },
      {
        id: "owned-private",
        name: "Beta Mage",
        userId: "owner",
        visibility: "private",
      },
      {
        id: "foreign-private",
        name: "Gamma Mage",
        userId: "other",
        visibility: "private",
      },
      { id: "special", name: "Rock & Ice + 雪", userId: "other" },
    ].map((row): typeof schema.classes.$inferInsert => ({
      ...row,
      visibility: row.visibility === "private" ? "private" : "public",
      description: "Not part of the picker response",
      subclassNamePreface: "The",
      hitDie: "d8",
      startingHp: 8,
    }))
  );
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue(null);
});
afterAll(() => client.close());

it("preserves public-only anonymous results, order, buckets and minimal JSON", async () => {
  const response = await read("?searchTerm=Mage&userId=owner&visibility=all");
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual([
    {
      id: "public",
      name: "Alpha Mage",
      subclassNamePreface: "The",
      creatorImageUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
      bucket: "public",
    },
    {
      id: "official",
      name: "Delta Mage",
      subclassNamePreface: "The",
      creatorImageUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
      bucket: "official",
    },
    {
      id: "owned-public",
      name: "Zulu Mage",
      subclassNamePreface: "The",
      creatorImageUrl: "https://example.com/owner.png",
      bucket: "public",
    },
  ]);
});

it("derives owned public/private choices only from the session and deduplicates public rows", async () => {
  auth.mockResolvedValue({ user: { id: "owner" } });
  const response = await read("?searchTerm=mage&userId=other&ownerId=other");
  expect(
    (await response.json()).map((row: { id: string; bucket: string }) => [
      row.id,
      row.bucket,
    ])
  ).toEqual([
    ["owned-private", "owned"],
    ["owned-public", "owned"],
    ["public", "public"],
    ["official", "official"],
  ]);
  auth.mockResolvedValue({ user: { id: "other" } });
  expect(
    (await (await read("?searchTerm=Mage")).json()).map(
      (row: { id: string }) => row.id
    )
  ).toEqual(["public", "foreign-private", "official", "owned-public"]);
});

it("preserves optional/empty search, encoded text, LIKE wildcards and empty results", async () => {
  expect(await (await read()).json()).toEqual(
    await (await read("?searchTerm=")).json()
  );
  const special = await read(`?searchTerm=${encodeURIComponent("& Ice + 雪")}`);
  expect(await special.json()).toMatchObject([{ id: "special" }]);
  expect(await (await read("?searchTerm=%25")).json()).toHaveLength(4);
  expect(await (await read("?searchTerm=absent")).json()).toEqual([]);
  expect(await (await read("?searchTerm=' OR 1=1 --")).json()).toEqual([]);
});

it("records unexpected failures without exposing private details", async () => {
  const span = {
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
    recordException: vi.fn(),
    spanContext: vi.fn(),
    addEvent: vi.fn(),
    addLink: vi.fn(),
    addLinks: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: vi.fn(),
  };
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  getDatabase.mockImplementationOnce(() => {
    throw new Error("private database path");
  });
  const response = await read();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(span.recordException).toHaveBeenCalled();
});
