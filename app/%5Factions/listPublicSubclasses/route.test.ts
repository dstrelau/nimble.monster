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
  directory = mkdtempSync(join(tmpdir(), "public-subclasses-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
});

afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

it("returns name-sorted public subclasses with full relationships and only existing public identity", async () => {
  const db = getDatabase();
  await db.insert(schema.users).values({
    ...creator,
    email: "private@example.test",
    refreshToken: "private-token",
    role: "admin",
  });
  await db.insert(schema.sources).values({
    id: "source",
    name: "Source",
    abbreviation: "SRC",
    license: "CC",
    link: "https://example.test/source",
    createdAt,
    updatedAt,
  });
  await db.insert(schema.subclasses).values([
    {
      id: "z",
      name: "Zulu",
      className: "Mage",
      creatorId: "owner",
      visibility: "public",
      createdAt,
      updatedAt,
    },
    {
      id: "private",
      name: "A private",
      className: "Mage",
      creatorId: "owner",
      visibility: "private",
      createdAt,
      updatedAt,
    },
    {
      id: "a",
      name: "Alpha",
      namePreface: "Path of",
      tagline: "A tagline",
      description: "A description",
      className: "Berserker",
      classId: "class",
      sourceId: "source",
      creatorId: "owner",
      visibility: "public",
      likeCount: 3,
      createdAt,
      updatedAt,
    },
  ]);
  await db.insert(schema.subclassAbilities).values([
    {
      id: "later",
      subclassId: "a",
      level: 7,
      name: "Later",
      description: "Second level",
      orderIndex: 0,
    },
    {
      id: "first",
      subclassId: "a",
      level: 3,
      name: "First",
      description: "First level",
      orderIndex: 0,
    },
  ]);
  await db.insert(schema.classAbilityLists).values({
    id: "list",
    name: "Options",
    description: "Choices",
    characterClass: "Berserker",
    userId: "owner",
    createdAt,
    updatedAt,
  });
  await db.insert(schema.classAbilityItems).values([
    {
      id: "item2",
      classAbilityListId: "list",
      name: "Second",
      description: "Two",
      orderIndex: 1,
    },
    {
      id: "item1",
      classAbilityListId: "list",
      name: "First",
      description: "One",
      orderIndex: 0,
    },
  ]);
  await db
    .insert(schema.subclassesClassAbilityLists)
    .values({ subclassId: "a", abilityListId: "list", orderIndex: 0 });
  const award = {
    id: "award",
    slug: "award",
    name: "Award",
    abbreviation: "AW",
    description: "Won",
    url: "https://example.test/award",
    color: "gold",
    icon: "star",
    createdAt,
    updatedAt,
  };
  await db.insert(schema.awards).values(award);
  await db
    .insert(schema.subclassesAwards)
    .values({ subclassId: "a", awardId: "award" });

  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual([
    {
      id: "a",
      name: "Alpha",
      namePreface: "Path of",
      tagline: "A tagline",
      description: "A description",
      className: "Berserker",
      classId: "class",
      visibility: "public",
      likeCount: 3,
      createdAt,
      updatedAt,
      creator,
      source: {
        id: "source",
        name: "Source",
        abbreviation: "SRC",
        license: "CC",
        link: "https://example.test/source",
        createdAt,
        updatedAt,
      },
      awards: [award],
      levels: [
        {
          level: 3,
          abilities: [
            { id: "first", name: "First", description: "First level" },
          ],
        },
        {
          level: 7,
          abilities: [
            { id: "later", name: "Later", description: "Second level" },
          ],
        },
      ],
      abilityLists: [
        {
          id: "list",
          name: "Options",
          description: "Choices",
          characterClass: "Berserker",
          createdAt,
          updatedAt,
          creator,
          items: [
            { id: "item1", name: "First", description: "One" },
            { id: "item2", name: "Second", description: "Two" },
          ],
        },
      ],
    },
    {
      id: "z",
      name: "Zulu",
      className: "Mage",
      visibility: "public",
      likeCount: 0,
      createdAt,
      updatedAt,
      creator,
      levels: [],
      abilityLists: [],
    },
  ]);
});

it("returns an empty array without public subclasses", async () => {
  expect(await (await GET()).json()).toEqual([]);
});

it("records unexpected errors and returns a generic private JSON failure", async () => {
  const span = trace.getTracer("test").startSpan("public-subclasses");
  const recordException = vi.spyOn(span, "recordException");
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  vi.mocked(getDatabase).mockImplementationOnce(() => {
    throw new Error("private database path");
  });
  const response = await GET();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(recordException).toHaveBeenCalledWith(
    new Error("private database path")
  );
});
