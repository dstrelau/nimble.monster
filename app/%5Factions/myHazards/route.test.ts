import { createClient } from "@libsql/client";
import { encode } from "@msgpack/msgpack";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { encodeCursor } from "@/lib/utils/cursor";

const { getDatabase, auth } = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));
vi.mock("@/lib/auth", () => ({ auth }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const date = "2026-09-01T12:00:00.000Z";
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/myHazards?${query}`));

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", username: "owner" },
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
  await db.insert(schema.monsters).values([
    {
      id: "a",
      userId: "owner",
      name: "Alpha",
      level: "1/2",
      levelInt: -2,
      hp: 0,
      armor: "",
      hazard: true,
      sourceId: "source",
      likeCount: 2,
      kind: "Trap",
      abilities: [{ name: "Hidden", description: "Concealed" }],
      actions: [{ name: "Fall", description: "Rocks fall", damage: "1d6" }],
      moreInfo: "Falling rocks",
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "b",
      userId: "owner",
      name: "Alpha",
      level: "3",
      levelInt: 3,
      hp: 20,
      armor: "",
      hazard: true,
      visibility: "private",
      likeCount: 9,
      createdAt: "2026-09-02T12:00:00.000Z",
      updatedAt: date,
    },
    {
      id: "c",
      userId: "owner",
      name: "Zulu",
      level: "1/2",
      levelInt: -2,
      hp: 42,
      armor: "",
      hazard: true,
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "private",
      userId: "other",
      name: "Alpha private",
      level: "1",
      hp: 0,
      armor: "",
      hazard: true,
      visibility: "private",
      sourceId: "source",
    },
    {
      id: "monster",
      userId: "owner",
      name: "Alpha monster",
      level: "1",
      hp: 10,
      armor: "",
    },
    {
      id: "other",
      userId: "other",
      name: "Other",
      level: "1",
      hp: 0,
      armor: "",
      hazard: true,
    },
  ]);
  await db
    .insert(schema.monstersAwards)
    .values({ monsterId: "a", awardId: "award" });
});
beforeEach(() => {
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner" } });
});
afterAll(() => client.close());

it.each([null, { user: {} }])(
  "rejects missing session identity before SQL: %j",
  async (session) => {
    auth.mockResolvedValueOnce(session);
    getDatabase.mockClear();
    const response = await request("creatorId=owner");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(getDatabase).not.toHaveBeenCalled();
  }
);

it("serves only session-owned public/private hazards, ignoring submitted identity", async () => {
  const response = await request(
    "sort=name&creatorId=other&includePrivate=false&userId=other&visibility=public"
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.data.map((h: { id: string }) => h.id)).toEqual(["a", "b", "c"]);
  expect(body.nextCursor).toBeNull();
  expect(await (await request("search=absent")).json()).toEqual({
    data: [],
    nextCursor: null,
  });
});

it("returns full fields without other owners or monsters and separates sessions", async () => {
  const response = await request(
    "creatorId=other&search=Trap&source=C&level=-2&includePrivate=false&userId=other&visibility=private"
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
    hazard: true,
    visibility: "public",
    levelInt: -2,
    moreInfo: "Falling rocks",
    abilities: [{ name: "Hidden", description: "Concealed" }],
    actions: [{ name: "Fall", description: "Rocks fall", damage: "1d6" }],
    creator: { id: "owner", username: "owner" },
    createdAt: date,
    updatedAt: date,
    source: { abbreviation: "C", createdAt: date, updatedAt: date },
    awards: [{ slug: "winner", createdAt: date, updatedAt: date }],
  });
  expect(
    (await (await request("creatorId=owner&limit=3")).json()).nextCursor
  ).toBeNull();
  auth.mockResolvedValueOnce({ user: { id: "other" } });
  expect(
    (await (await request("creatorId=owner&sort=name")).json()).data.map(
      (h: { id: string }) => h.id
    )
  ).toEqual(["private", "other"]);
  auth.mockResolvedValueOnce({ user: { id: "missing" } });
  expect(await (await request("creatorId=owner")).json()).toEqual({
    data: [],
    nextCursor: null,
  });
  for (const query of [
    "creatorId=owner&search=absent",
    "creatorId=owner&source=absent",
  ]) {
    expect(await (await request(query)).json()).toEqual({
      data: [],
      nextCursor: null,
    });
  }
});

it.each([
  ["name", ["a", "b", "c"]],
  ["-name", ["c", "a", "b"]],
  ["createdAt", ["a", "c", "b"]],
  ["-createdAt", ["b", "a", "c"]],
  ["level", ["a", "c", "b"]],
  ["-level", ["b", "a", "c"]],
  ["-likes", ["b", "a", "c"]],
])(
  "paginates %s across asymmetric ties without repeats",
  async (sort, expected) => {
    const ids: string[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 3; page++) {
      const query = new URLSearchParams({
        creatorId: "owner",
        sort,
        limit: "1",
      });
      if (cursor) query.set("cursor", cursor);
      const response = await request(query.toString());
      expect(response.status).toBe(200);
      const body = await response.json();
      ids.push(...body.data.map((h: { id: string }) => h.id));
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
  "level=wat",
  "level=1.5",
  "cursor=",
  "cursor=invalid",
  `sort=name&cursor=${encodeCursor({ sort: "-createdAt", value: date, id: "a" })}`,
  `sort=name&cursor=${Buffer.from(encode({ sort: "name", id: "a" })).toString("base64url")}`,
  `sort=level&cursor=${Buffer.from(encode({ sort: "level", id: "a", value: "3" })).toString("base64url")}`,
])("rejects invalid input before SQL: %s", async (query) => {
  getDatabase.mockClear();
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: expect.any(String) });
  expect(getDatabase).not.toHaveBeenCalled();
});

it("records unexpected errors without exposing SQL details", async () => {
  const span = trace.getTracer("test").startSpan("hazards");
  const recordException = vi.spyOn(span, "recordException");
  const active = vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  try {
    getDatabase.mockImplementationOnce(() => {
      throw new Error("secret SQL failure");
    });
    const response = await request();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(recordException).toHaveBeenCalledWith(
      new Error("secret SQL failure")
    );
  } finally {
    active.mockRestore();
  }
});
