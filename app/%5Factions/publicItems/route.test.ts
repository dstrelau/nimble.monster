import { createClient } from "@libsql/client";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const date = "2026-09-01T12:00:00.000Z";
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/publicItems?${query}`));

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", username: "owner", discordId: "discord-owner" },
    { id: "other", username: "other" },
  ]);
  await db.insert(schema.sources).values({
    id: "source",
    name: "Core",
    abbreviation: "C & H",
    license: "Open",
    link: "https://example.com",
    createdAt: date,
    updatedAt: date,
  });
  await db.insert(schema.awards).values({
    id: "award",
    slug: "winner",
    name: "Winner",
    abbreviation: "W",
    url: "https://example.com",
    color: "blue",
    icon: "star",
    createdAt: date,
    updatedAt: date,
  });
  await db.insert(schema.items).values([
    {
      id: "a",
      userId: "owner",
      name: "Alpha",
      kind: "Moon & Sun",
      description: "Full description",
      moreInfo: "Details",
      imageIcon: "sword",
      imageBackdrop: "paper",
      rarity: "rare",
      sourceId: "source",
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "b",
      userId: "other",
      name: "Bravo",
      description: "B",
      rarity: "common",
      likeCount: 9,
      createdAt: "2026-09-03T12:00:00.000Z",
      updatedAt: date,
    },
    {
      id: "c",
      userId: "owner",
      name: "Zulu",
      description: "C",
      rarity: "very_rare",
      likeCount: 5,
      createdAt: "2026-09-02T12:00:00.000Z",
      updatedAt: date,
    },
    {
      id: "private",
      userId: "owner",
      name: "Alpha private",
      description: "Secret",
      rarity: "rare",
      visibility: "private",
      sourceId: "source",
      likeCount: 100,
    },
  ]);
  await db.insert(schema.itemsAwards).values({ itemId: "a", awardId: "award" });
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
});
afterAll(() => client.close());

it("preserves full public items and combined name/kind/rarity/source/creator filters, never private overrides", async () => {
  const response = await request(
    "search=Moon+%26+Sun&rarity=rare&source=C+%26+H&creatorId=owner&includePrivate=true&userId=owner"
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.hasMore).toBe(false);
  expect(body.data).toHaveLength(1);
  expect(body.data[0]).toMatchObject({
    id: "a",
    name: "Alpha",
    kind: "Moon & Sun",
    description: "Full description",
    moreInfo: "Details",
    imageIcon: "sword",
    imageBackdrop: "paper",
    visibility: "public",
    createdAt: date,
    updatedAt: date,
    creator: { id: "owner", username: "owner", discordId: "discord-owner" },
    source: { id: "source", abbreviation: "C & H", createdAt: date },
    awards: [{ id: "award", slug: "winner", updatedAt: date }],
  });
  expect(
    (
      await (
        await request("search=Alpha&creatorId=owner&includePrivate=true")
      ).json()
    ).data.map((item: { id: string }) => item.id)
  ).toEqual(["a"]);
});

it.each([
  ["name", ["a", "b", "c"]],
  ["-name", ["c", "b", "a"]],
  ["createdAt", ["a", "c", "b"]],
  ["-createdAt", ["b", "c", "a"]],
  ["-likes", ["b", "c", "a"]],
])("paginates %s without dropping the lookahead row", async (sort, ids) => {
  const first = await (
    await request(`sort=${sort}&limit=2&pageParam=0`)
  ).json();
  const second = await (
    await request(`sort=${sort}&limit=2&pageParam=1`)
  ).json();
  expect(first.data.map((item: { id: string }) => item.id)).toEqual(
    ids.slice(0, 2)
  );
  expect(first.hasMore).toBe(true);
  expect(second.data.map((item: { id: string }) => item.id)).toEqual(
    ids.slice(2)
  );
  expect(second.hasMore).toBe(false);
});

it.each([
  "search=missing",
  "source=unknown",
  "creatorId=missing",
  "rarity=legendary",
  "pageParam=100",
])("returns an empty page for %s", async (query) => {
  expect(await (await request(query)).json()).toEqual({
    data: [],
    hasMore: false,
  });
});
it("retains exact-limit continuation semantics and accepts boundary limits", async () => {
  expect((await (await request("limit=3")).json()).hasMore).toBe(false);
  expect((await (await request("limit=1")).json()).hasMore).toBe(true);
  expect((await request("limit=100")).status).toBe(200);
});
it.each([
  "sort=bogus",
  "sort=likes",
  "rarity=bogus",
  "limit=0",
  "limit=101",
  "limit=1.5",
  "limit=",
  "pageParam=-1",
  "pageParam=1.2",
  "pageParam=NaN",
  "pageParam=9007199254740991",
])("rejects invalid search %s", async (query) => {
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({ error: "Invalid item search" });
});
it("records unexpected failures and hides their details", async () => {
  const recordException = vi.fn();
  vi.spyOn(trace, "getActiveSpan").mockReturnValue({
    recordException,
    setStatus: vi.fn(),
    setAttribute: vi.fn(),
    setAttributes: vi.fn(),
    spanContext: vi.fn(),
    addEvent: vi.fn(),
    addLink: vi.fn(),
    addLinks: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: vi.fn(),
  });
  getDatabase.mockImplementationOnce(() => {
    throw new Error("private database failure");
  });
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(recordException).toHaveBeenCalled();
});
