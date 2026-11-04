import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Client, createClient } from "@libsql/client";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getDatabase } from "@/lib/db/drizzle";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";
import { GET } from "./route";

vi.mock("@/lib/db/drizzle", () => ({ getDatabase: vi.fn() }));
let client: Client;
let directory: string;
const createdAt = "2026-01-02T03:04:05.000Z";
const updatedAt = "2026-06-07T08:09:10.000Z";
const creator = {
  id: "owner",
  discordId: "discord-owner",
  username: "owner",
  displayName: "Owner",
  imageUrl: "https://example.test/owner.png",
};

beforeEach(async () => {
  vi.restoreAllMocks();
  directory = mkdtempSync(join(tmpdir(), "public-classes-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
});
afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

it("returns only public classes in name order with full nested data and public identity", async () => {
  const db = getDatabase();
  await db.insert(schema.users).values({
    ...creator,
    email: "private@example.test",
    refreshToken: "secret",
    role: "admin",
  });
  await db.insert(schema.sources).values({
    id: "source",
    name: "Source",
    abbreviation: "SRC",
    license: "CC",
    link: "https://example.test",
    createdAt,
    updatedAt,
  });
  const base = {
    creatorId: "owner",
    description: "Description",
    hitDie: "d8",
    startingHp: 13,
    createdAt,
    updatedAt,
  };
  await db.insert(schema.classes).values([
    { ...base, id: "z", name: "Zulu", visibility: "public" },
    { ...base, id: "hidden", name: "A private", visibility: "private" },
    {
      ...base,
      id: "a",
      name: "Alpha",
      visibility: "public",
      sourceId: "source",
      keyStats: ["dex"],
      startingGear: ["Rope"],
      likeCount: 3,
    },
  ]);
  await db.insert(schema.classAbilities).values([
    {
      id: "later",
      classId: "a",
      level: 7,
      name: "Later",
      description: "Two",
      orderIndex: 0,
    },
    {
      id: "first",
      classId: "a",
      level: 1,
      name: "First",
      description: "One",
      orderIndex: 0,
    },
  ]);
  await db.insert(schema.classAbilityLists).values({
    id: "list",
    userId: "owner",
    name: "Choices",
    description: "Options",
    createdAt,
    updatedAt,
  });
  await db.insert(schema.classAbilityItems).values({
    id: "choice",
    classAbilityListId: "list",
    name: "Choice",
    description: "Choose",
    orderIndex: 0,
  });
  await db
    .insert(schema.classesClassAbilityLists)
    .values({ classId: "a", abilityListId: "list", orderIndex: 0 });
  const award = {
    id: "award",
    slug: "award",
    name: "Award",
    abbreviation: "AW",
    description: "Won",
    url: "https://example.test",
    color: "gold",
    icon: "star",
    createdAt,
    updatedAt,
  };
  await db.insert(schema.awards).values(award);
  await db
    .insert(schema.classesAwards)
    .values({ classId: "a", awardId: "award" });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.map((value: { id: string }) => value.id)).toEqual(["a", "z"]);
  expect(body[0]).toEqual({
    id: "a",
    name: "Alpha",
    subclassNamePreface: "",
    description: "Description",
    hitDie: "d8",
    startingHp: 13,
    visibility: "public",
    keyStats: ["dex"],
    startingGear: ["Rope"],
    saves: "{}",
    armor: [],
    weapons: [],
    likeCount: 3,
    createdAt,
    updatedAt,
    creator,
    source: {
      id: "source",
      name: "Source",
      abbreviation: "SRC",
      license: "CC",
      link: "https://example.test",
      createdAt,
      updatedAt,
    },
    awards: [award],
    levels: [
      {
        level: 1,
        abilities: [{ id: "first", name: "First", description: "One" }],
      },
      {
        level: 7,
        abilities: [{ id: "later", name: "Later", description: "Two" }],
      },
    ],
    abilityLists: [
      {
        id: "list",
        name: "Choices",
        description: "Options",
        creator,
        createdAt,
        updatedAt,
        items: [{ id: "choice", name: "Choice", description: "Choose" }],
      },
    ],
  });
});
it("returns an empty array without public classes", async () => {
  expect(await (await GET()).json()).toEqual([]);
});
it("records unexpected failures without leaking database details", async () => {
  const span = trace.getTracer("test").startSpan("public-classes");
  const recordException = vi.spyOn(span, "recordException");
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  vi.mocked(getDatabase).mockImplementationOnce(() => {
    throw new Error("private database path");
  });
  const response = await GET();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(recordException).toHaveBeenCalledWith(
    new Error("private database path")
  );
});
