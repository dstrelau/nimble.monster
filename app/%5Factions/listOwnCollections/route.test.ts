import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";
import {
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import {
  createHazard,
  createMonster,
} from "@/lib/services/monsters/repository";

const { auth, getDatabase, recordException } = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
  recordException: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));
vi.mock("@/lib/telemetry", () => ({
  telemetry: (handler: () => Promise<Response>) => async () => {
    try {
      return await handler();
    } catch (error) {
      recordException(error);
      throw error;
    }
  },
}));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const date = "2026-09-01T12:00:00.000Z";
let monsterId: string;
let hazardId: string;

beforeAll(async () => {
  getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", discordId: "discord-owner", username: "owner" },
    { id: "other", discordId: "discord-other", username: "other" },
    { id: "empty", discordId: "discord-empty", username: "empty" },
  ]);
  await db.insert(schema.collections).values([
    {
      id: "z",
      name: "Zulu",
      creatorId: "owner",
      visibility: "public",
      createdAt: date,
    },
    {
      id: "a",
      name: "Alpha private",
      creatorId: "owner",
      visibility: "private",
      description: "Private notes",
      createdAt: date,
    },
    {
      id: "foreign",
      name: "Other private",
      creatorId: "other",
      visibility: "private",
    },
  ]);
  const { monsters } = validateOfficialMonstersJSON(
    JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
  );
  const input = parseJSONAPIMonster(monsters[0]);
  monsterId = (await createMonster(input, "discord-owner")).id;
  hazardId = (await createHazard(input, "discord-owner")).id;
  await db.insert(schema.monstersCollections).values([
    { collectionId: "a", monsterId },
    { collectionId: "a", monsterId: hazardId },
  ]);
  await db.insert(schema.items).values({
    id: "item",
    userId: "owner",
    name: "Item",
    description: "Description",
    createdAt: date,
    updatedAt: date,
  });
  await db
    .insert(schema.itemsCollections)
    .values({ collectionId: "a", itemId: "item" });
  await db.insert(schema.companions).values({
    id: "companion",
    userId: "owner",
    name: "Companion",
    hpPerLevel: "3",
  });
  await db
    .insert(schema.companionsCollections)
    .values({ collectionId: "a", companionId: "companion" });
  await db.insert(schema.ancestries).values([
    {
      id: "ancestry",
      userId: "owner",
      name: "Ancestry",
      description: "Description",
      visibility: "private",
      createdAt: date,
      updatedAt: date,
    },
    {
      id: "foreign-ancestry",
      userId: "other",
      name: "Foreign private",
      description: "Hidden",
      visibility: "private",
    },
  ]);
  await db.insert(schema.ancestriesCollections).values([
    { collectionId: "a", ancestryId: "ancestry" },
    { collectionId: "a", ancestryId: "foreign-ancestry" },
  ]);
  await db.insert(schema.backgrounds).values({
    id: "background",
    userId: "owner",
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
    userId: "owner",
    name: "Subclass",
    className: "Class",
    createdAt: date,
  });
  await db
    .insert(schema.subclassesCollections)
    .values({ collectionId: "a", subclassId: "subclass" });
  await db
    .insert(schema.spellSchools)
    .values({ id: "school", userId: "owner", name: "School", createdAt: date });
  await db
    .insert(schema.spellSchoolsCollections)
    .values({ collectionId: "a", spellSchoolId: "school" });
  await db.insert(schema.classes).values({
    id: "class",
    userId: "owner",
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
  vi.clearAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner", discordId: "discord-owner" } });
});
afterAll(() => client.close());

it("returns sorted session-owned public/private overviews with all membership kinds and JSON dates", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.collections.map((c: { id: string }) => c.id)).toEqual(["a", "z"]);
  const collection = body.collections[0];
  expect(collection).toMatchObject({
    id: "a",
    description: "Private notes",
    visibility: "private",
    createdAt: date,
    itemCount: 1,
  });
  expect(collection.creator.id).toBe("owner");
  expect(collection.monsters.map((m: { id: string }) => m.id).sort()).toEqual(
    [monsterId, hazardId].sort()
  );
  expect(
    collection.monsters.map((m: { hazard: boolean }) => m.hazard).sort()
  ).toEqual([false, true]);
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
  expect(collection.items[0]).toMatchObject({
    createdAt: date,
    updatedAt: date,
  });
  expect(collection.spellSchools[0].spellCount).toBeUndefined();
});

it("separates owners and preserves empty/unknown-user results", async () => {
  auth.mockResolvedValue({ user: { id: "other", discordId: "discord-other" } });
  const body = await (await GET()).json();
  expect(body.collections.map((c: { id: string }) => c.id)).toEqual([
    "foreign",
  ]);
  for (const discordId of ["discord-empty", "unknown"]) {
    auth.mockResolvedValue({ user: { id: "empty", discordId } });
    expect(await (await GET()).json()).toEqual({
      success: true,
      collections: [],
    });
  }
});

it.each([
  null,
  { user: {} },
  { user: { id: "owner" } },
  { user: { discordId: "discord-owner" } },
])(
  "rejects absent/incomplete sessions without reading data: %j",
  async (session) => {
    auth.mockResolvedValue(session);
    getDatabase.mockImplementation(() => {
      throw new Error("Must not read");
    });
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  }
);

it("records unexpected failures and returns a generic uncacheable 500", async () => {
  const error = new Error("secret SQL details");
  getDatabase.mockImplementation(() => {
    throw error;
  });
  const response = await GET();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(recordException).toHaveBeenCalledWith(error);
});
