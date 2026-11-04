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
  directory = mkdtempSync(join(tmpdir(), "public-schools-"));
  client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle(client, { schema: { ...schema, ...relations } });
  await migrate(db, { migrationsFolder: "migrations" });
  vi.mocked(getDatabase).mockReturnValue(db);
});
afterEach(() => {
  client.close();
  rmSync(directory, { recursive: true, force: true });
});

it("returns public schools in name order with tier-sorted spells, relationships and public creator identity", async () => {
  const db = getDatabase();
  await db.insert(schema.users).values({
    ...creator,
    email: "private@example.test",
    refreshToken: "secret",
    role: "admin",
  });
  const source = {
    id: "source",
    name: "Source",
    abbreviation: "SRC",
    license: "CC",
    link: "https://example.test",
    createdAt,
    updatedAt,
  };
  await db.insert(schema.sources).values(source);
  await db.insert(schema.spellSchools).values([
    {
      id: "z",
      name: "Zulu",
      creatorId: "owner",
      visibility: "public",
      createdAt,
      updatedAt,
    },
    {
      id: "private",
      name: "A private",
      creatorId: "owner",
      visibility: "private",
    },
    {
      id: "a",
      name: "Alpha",
      description: "School",
      creatorId: "owner",
      visibility: "public",
      sourceId: "source",
      likeCount: 3,
      createdAt,
      updatedAt,
    },
  ]);
  await db.insert(schema.spells).values([
    {
      id: "later",
      schoolId: "a",
      name: "Later",
      tier: 3,
      createdAt,
      updatedAt,
    },
    {
      id: "first",
      schoolId: "a",
      name: "First",
      tier: 0,
      version: 2,
      actions: 2,
      reaction: true,
      utility: true,
      targetType: "aoe",
      targetKind: "cone",
      targetDistance: 4,
      damage: "2d6",
      description: "Flame",
      highLevels: "More",
      concentration: "Keep",
      upcast: "Boost",
      createdAt,
      updatedAt,
    },
    { id: "hidden", schoolId: "private", name: "Never sent", tier: 1 },
  ]);
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
    .insert(schema.spellSchoolsAwards)
    .values({ schoolId: "a", awardId: "award" });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.map((s: { id: string }) => s.id)).toEqual(["a", "z"]);
  expect(body[0]).toEqual({
    id: "a",
    name: "Alpha",
    description: "School",
    visibility: "public",
    likeCount: 3,
    createdAt,
    updatedAt,
    creator,
    source,
    awards: [award],
    spells: [
      {
        id: "first",
        schoolId: "a",
        name: "First",
        tier: 0,
        version: 2,
        actions: 2,
        reaction: true,
        utility: true,
        target: { type: "aoe", kind: "cone", distance: 4 },
        damage: "2d6",
        description: "Flame",
        highLevels: "More",
        concentration: "Keep",
        upcast: "Boost",
        createdAt,
        updatedAt,
      },
      {
        id: "later",
        schoolId: "a",
        name: "Later",
        tier: 3,
        version: 3,
        actions: 1,
        reaction: false,
        utility: false,
        createdAt,
        updatedAt,
      },
    ],
  });
  expect(body[1].spells).toEqual([]);
});
it("returns an empty list without public schools", async () => {
  expect(await (await GET()).json()).toEqual([]);
});
it("records failures and returns generic private JSON", async () => {
  const span = trace.getTracer("test").startSpan("public-schools");
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
