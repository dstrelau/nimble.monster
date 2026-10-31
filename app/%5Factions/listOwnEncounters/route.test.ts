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
let privateId: string;
let foreignId: string;

beforeAll(async () => {
  getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", discordId: "discord-owner", username: "owner" },
    { id: "other", discordId: "discord-other", username: "other" },
    { id: "empty", discordId: "discord-empty", username: "empty" },
  ]);
  await db.insert(schema.encounters).values([
    {
      id: "a",
      name: "Alpha private",
      creatorId: "owner",
      visibility: "private",
      description: "Notes",
      heroCount: 3,
      heroLevel: 7,
      createdAt: date,
    },
    {
      id: "z",
      name: "Zulu public",
      creatorId: "owner",
      visibility: "public",
      heroCount: 5,
      heroLevel: 2,
    },
    {
      id: "foreign",
      name: "Foreign private",
      creatorId: "other",
      visibility: "private",
    },
  ]);
  const { monsters } = validateOfficialMonstersJSON(
    JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
  );
  const input = parseJSONAPIMonster(monsters[0]);
  monsterId = (
    await createMonster({ ...input, visibility: "public" }, "discord-owner")
  ).id;
  hazardId = (
    await createHazard({ ...input, visibility: "public" }, "discord-owner")
  ).id;
  privateId = (
    await createMonster({ ...input, visibility: "private" }, "discord-owner")
  ).id;
  foreignId = (
    await createMonster({ ...input, visibility: "private" }, "discord-other")
  ).id;
  await db.insert(schema.monstersEncounters).values([
    {
      encounterId: "a",
      monsterId,
      quantity: 3,
      isPerHero: true,
      heroesPerMonster: 4,
    },
    { encounterId: "a", monsterId: hazardId, quantity: 2 },
    { encounterId: "a", monsterId: privateId },
    { encounterId: "a", monsterId: foreignId },
    { encounterId: "z", monsterId: privateId },
  ]);
});
beforeEach(() => {
  vi.clearAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner", discordId: "discord-owner" } });
});
afterAll(() => client.close());

it("returns name-sorted owner overviews, quantities, dates and existing monster visibility rules", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.encounters.map((e: { id: string }) => e.id)).toEqual(["a", "z"]);
  const encounter = body.encounters[0];
  expect(encounter).toMatchObject({
    description: "Notes",
    visibility: "private",
    heroCount: 3,
    heroLevel: 7,
    createdAt: date,
    creator: { id: "owner" },
  });
  expect(
    encounter.monsters
      .map((e: { monster: { id: string } }) => e.monster.id)
      .sort()
  ).toEqual([monsterId, hazardId, privateId].sort());
  expect(
    encounter.monsters.find(
      (e: { monster: { id: string } }) => e.monster.id === monsterId
    )
  ).toMatchObject({ quantity: 3, isPerHero: true, heroesPerMonster: 4 });
  expect(typeof encounter.monsters[0].monster.createdAt).toBe("string");
  expect(body.encounters[1].monsters).toEqual([]);
});

it("isolates owners and retains empty/unknown-user results", async () => {
  auth.mockResolvedValue({ user: { id: "other", discordId: "discord-other" } });
  expect(
    (await (await GET()).json()).encounters.map((e: { id: string }) => e.id)
  ).toEqual(["foreign"]);
  for (const discordId of ["discord-empty", "unknown"]) {
    auth.mockResolvedValue({ user: { id: "empty", discordId } });
    expect(await (await GET()).json()).toEqual({
      success: true,
      encounters: [],
    });
  }
});

it.each([
  null,
  { user: {} },
  { user: { id: "owner" } },
  { user: { discordId: "discord-owner" } },
])("rejects missing/incomplete sessions: %j", async (session) => {
  auth.mockResolvedValue(session);
  getDatabase.mockImplementation(() => {
    throw new Error("Must not read");
  });
  const response = await GET();
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Not authenticated" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("records unexpected failures without exposing SQL details", async () => {
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
