import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import {
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import { createMonster } from "@/lib/services/monsters/repository";

const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const date = "2026-09-01T12:00:00.000Z";
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/publicCollections?${query}`));
let monsterId: string;

beforeAll(async () => {
  getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", username: "owner", discordId: "discord-owner" },
    { id: "other", username: "other" },
  ]);
  await db.insert(schema.collections).values([
    {
      id: "a",
      creatorId: "owner",
      name: "Alpha & Sun",
      description: "Moon notes Page",
      createdAt: date,
    },
    {
      id: "b",
      creatorId: "other",
      name: "Bravo",
      description: "Page",
      createdAt: "2026-09-03T12:00:00.000Z",
    },
    {
      id: "c",
      creatorId: "owner",
      name: "Zulu",
      description: "Page",
      createdAt: "2026-09-02T12:00:00.000Z",
    },
    {
      id: "private",
      creatorId: "owner",
      name: "Private",
      visibility: "private",
    },
    {
      id: "empty",
      creatorId: "owner",
      name: "Empty only",
      createdAt: "2026-09-04T12:00:00.000Z",
    },
  ]);
  await db.insert(schema.items).values([
    {
      id: "item",
      creatorId: "owner",
      name: "Item",
      createdAt: date,
      updatedAt: date,
    },
    { id: "hidden", creatorId: "owner", name: "Hidden", visibility: "private" },
  ]);
  await db.insert(schema.itemsCollections).values([
    ...["a", "b", "c", "private"].map((collectionId) => ({
      collectionId,
      itemId: "item",
    })),
    { collectionId: "a", itemId: "hidden" },
    { collectionId: "empty", itemId: "hidden" },
  ]);
  const { monsters } = validateOfficialMonstersJSON(
    JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
  );
  const input = parseJSONAPIMonster(monsters[0]);
  monsterId = (await createMonster(input, "discord-owner")).id;
  const privateMonsterId = (
    await createMonster({ ...input, visibility: "private" }, "discord-owner")
  ).id;
  await db.insert(schema.monstersCollections).values([
    { collectionId: "a", monsterId },
    { collectionId: "a", monsterId: privateMonsterId },
  ]);
  await db.insert(schema.companions).values({
    id: "companion",
    creatorId: "owner",
    name: "Companion",
    hpPerLevel: "3",
  });
  await db
    .insert(schema.companionsCollections)
    .values({ collectionId: "a", companionId: "companion" });
  await db.insert(schema.ancestries).values([
    {
      id: "ancestry",
      creatorId: "owner",
      name: "Ancestry",
      description: "Description",
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "hidden-ancestry",
      creatorId: "owner",
      name: "Hidden",
      description: "Hidden",
      visibility: "private",
    },
  ]);
  await db.insert(schema.ancestriesCollections).values([
    { collectionId: "a", ancestryId: "ancestry" },
    { collectionId: "a", ancestryId: "hidden-ancestry" },
  ]);
  await db.insert(schema.backgrounds).values({
    id: "background",
    creatorId: "owner",
    name: "Background",
    description: "Description",
    createdAt: date,
    updatedAt: date,
  });
  await db
    .insert(schema.backgroundsCollections)
    .values({ collectionId: "a", backgroundId: "background" });
  await db.insert(schema.subclasses).values({
    id: "subclass",
    creatorId: "owner",
    name: "Subclass",
    className: "Class",
    createdAt: date,
  });
  await db
    .insert(schema.subclassesCollections)
    .values({ collectionId: "a", subclassId: "subclass" });
  await db.insert(schema.spellSchools).values({
    id: "school",
    creatorId: "owner",
    name: "School",
    createdAt: date,
  });
  await db
    .insert(schema.spellSchoolsCollections)
    .values({ collectionId: "a", spellSchoolId: "school" });
  await db.insert(schema.classes).values({
    id: "class",
    creatorId: "owner",
    name: "Class",
    description: "Description",
    hitDie: "d8",
    startingHp: 8,
    createdAt: date,
  });
  await db
    .insert(schema.classesCollections)
    .values({ collectionId: "a", classId: "class" });
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
});
afterAll(() => client.close());

it("preserves public overviews, memberships and dates without exposing private collections or members", async () => {
  const response = await request(
    "search=Alpha+%26+Sun&includePrivate=true&creatorId=other&userId=owner"
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.hasMore).toBe(false);
  expect(body.data).toHaveLength(1);
  const collection = body.data[0];
  expect(collection).toMatchObject({
    id: "a",
    description: "Moon notes Page",
    visibility: "public",
    createdAt: date,
    itemCount: 1,
    creator: { id: "owner", username: "owner" },
  });
  expect(collection.monsters.map((m: { id: string }) => m.id)).toEqual([
    monsterId,
  ]);
  for (const [key, id] of Object.entries({
    items: "item",
    companions: "companion",
    ancestries: "ancestry",
    backgrounds: "background",
    subclasses: "subclass",
    spellSchools: "school",
    classes: "class",
  })) {
    expect(collection[key].map((entity: { id: string }) => entity.id)).toEqual([
      id,
    ]);
  }
  expect(collection.items[0].updatedAt).toBe(date);
  expect(collection.ancestries[0].createdAt).toBe(date);
  expect((await (await request("search=Moon")).json()).data[0].id).toBe("a");
  expect(
    (
      await (
        await request("search=Private&includePrivate=true&userId=owner")
      ).json()
    ).data
  ).toEqual([]);
});

it.each([
  ["name", ["a", "b", "c"]],
  ["-name", ["c", "b", "a"]],
  ["createdAt", ["a", "c", "b"]],
  ["-createdAt", ["b", "c", "a"]],
])("retains %s ordering, offsets and lookahead", async (sort, ids) => {
  const query = `sort=${sort}&limit=2&search=Page`;
  const first = await (await request(query)).json();
  const second = await (await request(`${query}&pageParam=1`)).json();
  expect(first.data.map((c: { id: string }) => c.id)).toEqual(ids.slice(0, 2));
  expect(first.hasMore).toBe(true);
  expect(second.data.map((c: { id: string }) => c.id)).toEqual(ids.slice(2));
  expect(second.hasMore).toBe(false);
});

it("retains exact-limit, empty and existing post-query content-filter behavior", async () => {
  // Existing SQL takes limit+1 before filtering empty collections; retain it.
  const filtered = await (await request("limit=2&sort=name")).json();
  expect(filtered.data.map((c: { id: string }) => c.id)).toEqual(["a", "b"]);
  expect(filtered.hasMore).toBe(false);
  expect(await (await request("limit=3&sort=createdAt")).json()).toMatchObject({
    hasMore: false,
  });
  expect(await (await request("search=Empty")).json()).toEqual({
    data: [],
    hasMore: false,
  });
  expect(await (await request("search=missing")).json()).toEqual({
    data: [],
    hasMore: false,
  });
  expect(await (await request("pageParam=100")).json()).toEqual({
    data: [],
    hasMore: false,
  });
  expect((await request("limit=100")).status).toBe(200);
});

it.each([
  "sort=bogus",
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
  expect(await response.json()).toEqual({ error: "Invalid collection search" });
});

it("records unexpected failures and returns only a generic error", async () => {
  const span = trace.getTracer("test").startSpan("collection");
  const recordException = vi.spyOn(span, "recordException");
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  getDatabase.mockImplementationOnce(() => {
    throw new Error("secret database failure");
  });
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(recordException).toHaveBeenCalled();
});
