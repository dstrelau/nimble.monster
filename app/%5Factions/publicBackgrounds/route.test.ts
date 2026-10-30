import { createClient } from "@libsql/client";
import { encode } from "@msgpack/msgpack";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { encodeCursor } from "@/lib/utils/cursor";

const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const date = "2026-09-01T12:00:00.000Z";
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/publicBackgrounds?${query}`));

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", username: "owner", discordId: "creator" },
    { id: "other", username: "other" },
  ]);
  await db.insert(schema.sources).values({
    id: "source",
    name: "Core",
    abbreviation: "C",
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
  await db.insert(schema.backgrounds).values([
    {
      id: "a",
      userId: "owner",
      name: "Alpha",
      description: "Track",
      requirement: "DEX 2",
      sourceId: "source",
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "b",
      userId: "other",
      name: "Alpha",
      description: "Other",
      likeCount: 9,
      createdAt: "2026-09-02T12:00:00.000Z",
      updatedAt: date,
    },
    {
      id: "c",
      userId: "owner",
      name: "Zulu",
      description: "Last",
      sourceId: "source",
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "private",
      userId: "owner",
      name: "Alpha secret",
      description: "Hidden",
      sourceId: "source",
      visibility: "private",
      likeCount: 99,
    },
  ]);
  await db
    .insert(schema.backgroundsAwards)
    .values({ backgroundId: "a", awardId: "award" });
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
});
afterAll(() => client.close());

it("retains the public domain contract and relationships without accepting visibility authority", async () => {
  const response = await request(
    "search=Alpha&source=C&creatorId=owner&includePrivate=true&userId=owner&visibility=private"
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual({
    nextCursor: null,
    data: [
      {
        id: "a",
        name: "Alpha",
        requirement: "DEX 2",
        description: "Track",
        createdAt: date,
        updatedAt: date,
        creator: expect.objectContaining({
          id: "owner",
          username: "owner",
          discordId: "creator",
        }),
        source: expect.objectContaining({
          abbreviation: "C",
          license: "Open",
          createdAt: date,
          updatedAt: date,
        }),
        awards: [
          expect.objectContaining({
            slug: "winner",
            createdAt: date,
            updatedAt: date,
          }),
        ],
      },
    ],
  });
  expect(
    (await (await request("source=C&limit=2")).json()).nextCursor
  ).toBeNull();
  expect(
    (await (await request("source=C&sort=name")).json()).data.map(
      (b: { id: string }) => b.id
    )
  ).toEqual(["a", "c"]);
  expect(
    (await (await request("creatorId=other")).json()).data.map(
      (b: { id: string }) => b.id
    )
  ).toEqual(["b"]);
  expect(await (await request("search=missing")).json()).toEqual({
    data: [],
    nextCursor: null,
  });
});

it.each([
  ["name", ["a", "b", "c"]],
  ["-name", ["c", "a", "b"]],
  ["createdAt", ["a", "c", "b"]],
  ["-createdAt", ["b", "a", "c"]],
  ["-likes", ["b", "a", "c"]],
])(
  "paginates %s with asymmetric ties and no omissions or duplicates",
  async (sort, expected) => {
    const ids: string[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 3; page++) {
      const query = new URLSearchParams({ sort, limit: "1" });
      if (cursor) query.set("cursor", cursor);
      const response = await request(query.toString());
      expect(response.status).toBe(200);
      const body = await response.json();
      ids.push(...body.data.map((b: { id: string }) => b.id));
      cursor = body.nextCursor;
      expect(cursor === null).toBe(page === 2);
    }
    expect(ids).toEqual(expected);
  }
);

it.each([
  "limit=0",
  "limit=101",
  "limit=1.5",
  "limit=wat",
  "limit=",
  "sort=bad",
  "cursor=",
  "cursor=invalid",
  `sort=name&cursor=${encodeCursor({ sort: "-createdAt", value: date, id: "a" })}`,
  `sort=name&cursor=${Buffer.from(encode({ sort: "name", id: "a" })).toString("base64url")}`,
  `sort=-likes&cursor=${Buffer.from(encode({ sort: "-likes", id: "a", value: "9" })).toString("base64url")}`,
])("rejects invalid search/cursor at the boundary: %s", async (query) => {
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: expect.any(String) });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("hides unexpected database failures", async () => {
  getDatabase.mockImplementationOnce(() => {
    throw new Error("Sensitive SQL details");
  });
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
