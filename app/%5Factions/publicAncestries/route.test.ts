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
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const date = "2026-09-01T12:00:00.000Z";
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/publicAncestries?${query}`));

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: owner, username: "owner" },
    { id: other, username: "other" },
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
  await db.insert(schema.ancestries).values([
    {
      id: "a",
      userId: owner,
      name: "Alpha",
      description: "Alpha description",
      size: '["small"]',
      abilities: [{ name: "Flight", description: "Fly" }],
      sourceId: "source",
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "b",
      userId: other,
      name: "Alpha",
      description: "Other alpha",
      size: '["large"]',
      abilities: [],
      likeCount: 9,
      createdAt: "2026-09-02T12:00:00.000Z",
      updatedAt: date,
    },
    {
      id: "c",
      userId: owner,
      name: "Zulu",
      description: "Zulu description",
      size: '["medium"]',
      abilities: [],
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "private",
      userId: owner,
      name: "Alpha private",
      description: "Secret",
      size: "[]",
      abilities: [],
      visibility: "private",
      sourceId: "source",
      likeCount: 99,
    },
  ]);
  await db
    .insert(schema.ancestriesAwards)
    .values({ ancestryId: "a", awardId: "award" });
});
beforeEach(() => getDatabase.mockReturnValue(db));
afterAll(() => client.close());

it("returns public domain fields, relationships and JSON dates without CORS", async () => {
  const response = await request(
    `search=Alpha&source=C&creatorId=${owner}&includePrivate=true&userId=${owner}`
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.nextCursor).toBeNull();
  expect(body.data).toHaveLength(1);
  expect(body.data[0]).toMatchObject({
    id: "a",
    name: "Alpha",
    visibility: "public",
    description: "Alpha description",
    size: ["small"],
    abilities: [{ name: "Flight", description: "Fly" }],
    createdAt: date,
    updatedAt: date,
    creator: { id: owner, username: "owner" },
    source: { abbreviation: "C", createdAt: date, updatedAt: date },
    awards: [{ slug: "winner", createdAt: date, updatedAt: date }],
  });
  expect(
    (await (await request(`creatorId=${other}`)).json()).data.map(
      (a: { id: string }) => a.id
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
  "paginates %s without omissions or duplicate ties",
  async (sort, expected) => {
    const ids: string[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 3; page++) {
      const query = new URLSearchParams({ sort, limit: "1" });
      if (cursor) query.set("cursor", cursor);
      const response = await request(query.toString());
      expect(response.status).toBe(200);
      const body = await response.json();
      ids.push(...body.data.map((a: { id: string }) => a.id));
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
  "sort=bad",
  "cursor=",
  "cursor=invalid",
  `sort=name&cursor=${encodeCursor({ sort: "-createdAt", value: date, id: "a" })}`,
  `sort=name&cursor=${Buffer.from(encode({ sort: "name", id: "a" })).toString("base64url")}`,
  `sort=-likes&cursor=${Buffer.from(encode({ sort: "-likes", id: "a", value: "9" })).toString("base64url")}`,
])("rejects malformed pagination at the boundary: %s", async (query) => {
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: expect.any(String) });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("hides unexpected failures", async () => {
  getDatabase.mockImplementationOnce(() => {
    throw new Error("Sensitive SQL details");
  });
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});
