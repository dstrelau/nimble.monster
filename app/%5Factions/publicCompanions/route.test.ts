import { createClient } from "@libsql/client";
import { encode } from "@msgpack/msgpack";
import { trace } from "@opentelemetry/api";
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
  GET(new Request(`https://nimble.nexus/_actions/publicCompanions?${query}`));

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
  await db.insert(schema.companions).values([
    {
      id: "a",
      userId: "owner",
      name: "Alpha",
      kind: "Wolf",
      class: "Hunter, Mage",
      hpPerLevel: "4",
      wounds: 2,
      size: "small",
      saves: "DEX",
      abilities: [{ name: "Keen", description: "Track" }],
      actions: [{ name: "Bite", description: "Hit", extended: true }],
      actionPreface: "Attack",
      dyingRule: "Fall",
      moreInfo: "Details",
      paperforgeId: "wolf",
      sourceId: "source",
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "b",
      userId: "other",
      name: "Alpha",
      kind: "Bird",
      class: "Mage",
      hpPerLevel: "3",
      likeCount: 9,
      createdAt: "2026-09-02T12:00:00.000Z",
      updatedAt: date,
    },
    {
      id: "c",
      userId: "owner",
      name: "Zulu",
      class: "Hunter",
      hpPerLevel: "5",
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "private",
      userId: "owner",
      name: "Alpha secret",
      class: "Hunter",
      hpPerLevel: "9",
      visibility: "private",
      likeCount: 99,
    },
  ]);
  await db
    .insert(schema.companionsAwards)
    .values({ companionId: "a", awardId: "award" });
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
});
afterAll(() => client.close());

it("retains public fields and relationships while ignoring owner/visibility authority", async () => {
  const response = await request(
    "search=Wolf&class=Hunter&creatorId=owner&includePrivate=true&userId=owner&visibility=private"
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
    kind: "Wolf",
    class: "Hunter, Mage",
    hp_per_level: "4",
    wounds: 2,
    size: "small",
    saves: "DEX",
    visibility: "public",
    abilities: [{ id: expect.any(String), name: "Keen", description: "Track" }],
    actions: [
      {
        id: expect.any(String),
        name: "Bite",
        description: "Hit",
        extended: true,
      },
    ],
    actionPreface: "Attack",
    dyingRule: "Fall",
    moreInfo: "Details",
    paperforgeId: "wolf",
    updatedAt: date,
    creator: { id: "owner", username: "owner", discordId: "creator" },
    source: {
      abbreviation: "C",
      license: "Open",
      createdAt: date,
      updatedAt: date,
    },
    awards: [{ slug: "winner", createdAt: date, updatedAt: date }],
  });
  expect(
    (
      await (
        await request("class=Hunter&creatorId=owner&includePrivate=true")
      ).json()
    ).data
      .map((c: { id: string }) => c.id)
      .sort()
  ).toEqual(["a", "c"]);
  expect(
    (await (await request("creatorId=other")).json()).data.map(
      (c: { id: string }) => c.id
    )
  ).toEqual(["b"]);
  expect(await (await request("search=missing")).json()).toEqual({
    data: [],
    nextCursor: null,
  });
  expect(
    (await (await request("search=Hunter&limit=2")).json()).nextCursor
  ).toBeNull();
});

it.each([
  ["name", ["a", "b", "c"]],
  ["-name", ["c", "a", "b"]],
  ["createdAt", ["a", "c", "b"]],
  ["-createdAt", ["b", "a", "c"]],
  ["-likes", ["b", "a", "c"]],
])(
  "paginates %s with asymmetric ties and no duplicates",
  async (sort, expected) => {
    const ids: string[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 3; page++) {
      const query = new URLSearchParams({ sort, limit: "1" });
      if (cursor) query.set("cursor", cursor);
      const response = await request(query.toString());
      expect(response.status).toBe(200);
      const body = await response.json();
      ids.push(...body.data.map((c: { id: string }) => c.id));
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
  "class=bad",
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

it("records unexpected failures and hides details", async () => {
  const span = {
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
    recordException: vi.fn(),
  };
  vi.spyOn(trace, "getActiveSpan").mockReturnValue({
    ...span,
    spanContext: vi.fn(),
    addEvent: vi.fn(),
    addLink: vi.fn(),
    addLinks: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: vi.fn(),
  });
  getDatabase.mockImplementationOnce(() => {
    throw new Error("Sensitive SQL details");
  });
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(span.recordException).toHaveBeenCalled();
});
