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
  telemetry:
    (handler: (request: Request) => Promise<Response>) =>
    async (request: Request) => {
      try {
        return await handler(request);
      } catch (error) {
        recordException(error);
        throw error;
      }
    },
}));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/myEncounters?${query}`));
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
  await db.insert(schema.encounters).values([
    {
      id: "a",
      name: "Alpha",
      creatorId: "owner",
      visibility: "private",
      description: "Moon & Sun",
      heroCount: 3,
      heroLevel: 7,
      createdAt: "2026-09-03T12:00:00.000Z",
    },
    {
      id: "m",
      name: "Middle",
      creatorId: "owner",
      visibility: "public",
      createdAt: "2026-09-01T12:00:00.000Z",
    },
    {
      id: "z",
      name: "Zulu",
      creatorId: "owner",
      visibility: "private",
      createdAt: "2026-09-02T12:00:00.000Z",
    },
    {
      id: "foreign",
      name: "Foreign",
      creatorId: "other",
      visibility: "private",
    },
  ]);
  const { monsters } = validateOfficialMonstersJSON(
    JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
  );
  const input = parseJSONAPIMonster(monsters[0]);
  monsterId = (
    await createMonster({ ...input, visibility: "private" }, "discord-owner")
  ).id;
  hazardId = (
    await createHazard({ ...input, visibility: "public" }, "discord-owner")
  ).id;
  const foreignId = (
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
    { encounterId: "a", monsterId: foreignId },
    { encounterId: "m", monsterId },
  ]);
});
beforeEach(() => {
  vi.clearAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner" } });
});
afterAll(() => client.close());

it.each([
  ["name", ["a", "m", "z"]],
  ["-name", ["z", "m", "a"]],
  ["createdAt", ["m", "z", "a"]],
  ["-createdAt", ["a", "z", "m"]],
])(
  "paginates owner public/private encounters by %s with lookahead",
  async (sort, ids) => {
    const first = await (
      await request(`sort=${sort}&limit=2&pageParam=0`)
    ).json();
    const last = await (
      await request(`sort=${sort}&limit=2&pageParam=1`)
    ).json();
    expect(first.data.map((row: { id: string }) => row.id)).toEqual(
      ids.slice(0, 2)
    );
    expect(first.hasMore).toBe(true);
    expect(last.data.map((row: { id: string }) => row.id)).toEqual(
      ids.slice(2)
    );
    expect(last.hasMore).toBe(false);
    expect(
      await (await request(`sort=${sort}&limit=2&pageParam=2`)).json()
    ).toEqual({ data: [], hasMore: false });
  }
);

it("preserves search, relationships, dates, and private-monster visibility without identity overrides", async () => {
  const response = await request(
    "search=Moon+%26+Sun&creatorId=other&userId=other&visibility=public"
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  const body = await response.json();
  expect(body.hasMore).toBe(false);
  expect(body.data).toHaveLength(1);
  expect(body.data[0]).toMatchObject({
    id: "a",
    creator: { id: "owner" },
    visibility: "private",
    description: "Moon & Sun",
    heroCount: 3,
    heroLevel: 7,
    createdAt: "2026-09-03T12:00:00.000Z",
  });
  expect(
    body.data[0].monsters
      .map((entry: { monster: { id: string } }) => entry.monster.id)
      .sort()
  ).toEqual([monsterId, hazardId].sort());
  expect(
    body.data[0].monsters.find(
      (entry: { monster: { id: string } }) => entry.monster.id === monsterId
    )
  ).toMatchObject({ quantity: 3, isPerHero: true, heroesPerMonster: 4 });
  expect(typeof body.data[0].monsters[0].monster.createdAt).toBe("string");
  const publicPage = await (await request("search=Middle")).json();
  expect(publicPage.data[0].monsters).toEqual([]);
});

it("isolates owners, handles exact-limit and empty results, and requires a session", async () => {
  expect((await (await request("limit=3")).json()).hasMore).toBe(false);
  auth.mockResolvedValue({ user: { id: "other" } });
  expect(
    (await (await request("creatorId=owner")).json()).data.map(
      (row: { id: string }) => row.id
    )
  ).toEqual(["foreign"]);
  auth.mockResolvedValue({ user: { id: "empty" } });
  expect(await (await request()).json()).toEqual({ data: [], hasMore: false });
  for (const session of [null, { user: {} }]) {
    auth.mockResolvedValue(session);
    const response = await request();
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  }
});

it.each([
  "limit=0",
  "limit=101",
  "limit=1.5",
  "limit=x",
  "pageParam=-1",
  "pageParam=0.5",
  "pageParam=9007199254740991",
  "sort=unknown",
  "sort=",
])("rejects invalid filters before SQL: %s", async (query) => {
  getDatabase.mockRejectedValue(new Error("must not run"));
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(recordException).not.toHaveBeenCalled();
});

it("records unexpected failures without exposing internals", async () => {
  getDatabase.mockRejectedValueOnce(new Error("private database details"));
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(recordException).toHaveBeenCalledWith(expect.any(Error));
});
