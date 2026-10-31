import { createClient } from "@libsql/client";
import { encode } from "@msgpack/msgpack";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import { encodeCursor } from "@/lib/utils/cursor";

const { auth, getDatabase } = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET as getMyMonsters } from "../myMonsters/route";
import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const date = "2026-09-01T12:00:00.000Z";
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/publicMonsters?${query}`));

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
      hp: 13,
      armor: "medium",
      sourceId: "source",
      role: "melee",
      kind: "Beast",
      abilities: [{ name: "Flight", description: "Fly" }],
      likeCount: 2,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "b",
      userId: "other",
      name: "Alpha",
      level: "3",
      levelInt: 3,
      hp: 27,
      armor: "",
      minion: true,
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
      armor: "heavy",
      legendary: true,
      likeCount: 2,
      members: [
        { name: "Left", hp: 17 },
        { name: "Right", hp: 25 },
      ],
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "private",
      userId: "owner",
      name: "Alpha private",
      level: "1",
      levelInt: 1,
      hp: 10,
      armor: "",
      visibility: "private",
      sourceId: "source",
    },
    {
      id: "hazard",
      userId: "owner",
      name: "Alpha hazard",
      level: "1",
      levelInt: 1,
      hp: 0,
      armor: "",
      hazard: true,
      sourceId: "source",
    },
  ]);
  await db
    .insert(schema.monstersAwards)
    .values({ monsterId: "a", awardId: "award" });
  await db
    .insert(schema.families)
    .values({ id: "family", creatorId: "owner", name: "Pack" });
  await db
    .insert(schema.monstersFamilies)
    .values({ monsterId: "a", familyId: "family" });
});
beforeEach(() => {
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner" } });
});
afterAll(() => client.close());

it("scopes private pagination to the session, never query authority or hazards", async () => {
  const query = new URLSearchParams({
    sort: "name",
    creatorId: "other",
    userId: "other",
    includePrivate: "false",
  });
  const response = await getMyMonsters(
    new Request(`https://nimble.nexus/_actions/myMonsters?${query}`)
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.data.map((m: { id: string }) => m.id)).toEqual([
    "a",
    "private",
    "c",
  ]);
  expect(body.data[0]).toMatchObject({
    createdAt: date,
    source: { createdAt: date },
    awards: [{ createdAt: date }],
  });
  auth.mockResolvedValueOnce({ user: { id: "other" } });
  expect(
    (
      await (
        await getMyMonsters(
          new Request("https://nimble.nexus/_actions/myMonsters")
        )
      ).json()
    ).data.map((m: { id: string }) => m.id)
  ).toEqual(["b"]);
  auth.mockResolvedValueOnce({ user: { id: "empty" } });
  expect(
    await (
      await getMyMonsters(
        new Request("https://nimble.nexus/_actions/myMonsters")
      )
    ).json()
  ).toEqual({ data: [], nextCursor: null });
});

it("rejects anonymous private reads and paginates owned rows through the existing filters", async () => {
  auth.mockResolvedValueOnce(null);
  const anonymous = await getMyMonsters(
    new Request("https://nimble.nexus/_actions/myMonsters")
  );
  expect(anonymous.status).toBe(401);
  expect(await anonymous.json()).toEqual({ error: "Unauthorized" });
  expect(anonymous.headers.get("cache-control")).toBe("private, no-store");
  const ids: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 3; page++) {
    const params = new URLSearchParams({ sort: "name", limit: "1" });
    if (cursor) params.set("cursor", cursor);
    const response = await getMyMonsters(
      new Request(`https://nimble.nexus/_actions/myMonsters?${params}`)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    ids.push(...body.data.map((m: { id: string }) => m.id));
    cursor = body.nextCursor;
    expect(cursor === null).toBe(page === 2);
  }
  expect(ids).toEqual(["a", "private", "c"]);
  const filtered = await getMyMonsters(
    new Request(
      "https://nimble.nexus/_actions/myMonsters?source=C&search=Beast&role=melee&level=-2&type=standard"
    )
  );
  expect((await filtered.json()).data.map((m: { id: string }) => m.id)).toEqual(
    ["a"]
  );
});

it("retains public creature fields and relationships, ignoring private/identity overrides", async () => {
  const response = await request(
    "search=Beast&source=C&creatorId=owner&role=melee&level=-2&includePrivate=true&userId=owner"
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
    hp: 13,
    hazard: false,
    levelInt: -2,
    visibility: "public",
    abilities: [{ name: "Flight", description: "Fly" }],
    createdAt: date,
    updatedAt: date,
    creator: { id: "owner", username: "owner" },
    source: { abbreviation: "C", createdAt: date, updatedAt: date },
    awards: [{ slug: "winner", createdAt: date, updatedAt: date }],
    families: [{ id: "family", name: "Pack" }],
  });
  expect(
    (await (await request("creatorId=owner&includePrivate=true")).json()).data
      .map((m: { id: string }) => m.id)
      .sort()
  ).toEqual(["a", "c"]);
  expect(
    (await (await request("excludeCreatorId=owner")).json()).data.map(
      (m: { id: string }) => m.id
    )
  ).toEqual(["b"]);
  expect(await (await request("search=missing")).json()).toEqual({
    data: [],
    nextCursor: null,
  });
  expect(await (await request("source=missing")).json()).toEqual({
    data: [],
    nextCursor: null,
  });
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
  "paginates %s across ties without omissions or repeats",
  async (sort, expected) => {
    const ids: string[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 3; page++) {
      const query = new URLSearchParams({ sort, limit: "1" });
      if (cursor) query.set("cursor", cursor);
      const response = await request(query.toString());
      expect(response.status).toBe(200);
      const body = await response.json();
      ids.push(...body.data.map((m: { id: string }) => m.id));
      cursor = body.nextCursor;
      expect(cursor === null).toBe(page === 2);
    }
    expect(ids).toEqual(expected);
  }
);

it.each([
  ["standard", "a"],
  ["minion", "b"],
  ["legendary", "c"],
  ["teams", "c"],
])("filters %s without crossing entity types", async (type, id) => {
  const body = await (await request(`type=${type}`)).json();
  expect(body.data.map((m: { id: string }) => m.id)).toEqual([id]);
  if (type === "teams")
    expect(body.data[0].members).toMatchObject([
      { name: "Left", hp: 17 },
      { name: "Right", hp: 25 },
    ]);
});

it.each([
  "limit=0",
  "limit=101",
  "limit=1.5",
  "limit=wat",
  "sort=bad",
  "type=hazard",
  "role=bad",
  "level=wat",
  "level=1.5",
  "cursor=",
  "cursor=invalid",
  `sort=name&cursor=${encodeCursor({ sort: "-createdAt", value: date, id: "a" })}`,
  `sort=name&cursor=${Buffer.from(encode({ sort: "name", id: "a" })).toString("base64url")}`,
  `sort=level&cursor=${Buffer.from(encode({ sort: "level", id: "a", value: "3" })).toString("base64url")}`,
])("rejects invalid inputs before SQL: %s", async (query) => {
  getDatabase.mockClear();
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: expect.any(String) });
  const privateResponse = await getMyMonsters(
    new Request(`https://nimble.nexus/_actions/myMonsters?${query}`)
  );
  expect(privateResponse.status).toBe(400);
  expect(await privateResponse.json()).toEqual({ error: expect.any(String) });
  expect(getDatabase).not.toHaveBeenCalled();
});

it("hides unexpected SQL failures", async () => {
  const recordException = vi.fn();
  const span = vi.spyOn(trace, "getActiveSpan").mockReturnValue({
    recordException,
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
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
  expect(recordException).toHaveBeenCalledWith(
    new Error("Sensitive SQL details")
  );
  getDatabase.mockImplementationOnce(() => {
    throw new Error("Private SQL details");
  });
  const privateResponse = await getMyMonsters(
    new Request("https://nimble.nexus/_actions/myMonsters")
  );
  expect(privateResponse.status).toBe(500);
  expect(await privateResponse.json()).toEqual({
    error: "Internal Server Error",
  });
  expect(recordException).toHaveBeenCalledWith(
    new Error("Private SQL details")
  );
  span.mockRestore();
});
