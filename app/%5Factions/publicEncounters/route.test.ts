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
import {
  createHazard,
  createMonster,
} from "@/lib/services/monsters/repository";

const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const request = (query = "") =>
  GET(new Request(`https://nimble.nexus/_actions/publicEncounters?${query}`));
let monsterId: string;
let hazardId: string;
beforeAll(async () => {
  getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", username: "owner", discordId: "owner-discord" },
    { id: "other", username: "other", discordId: "other-discord" },
  ]);
  await db.insert(schema.encounters).values([
    {
      id: "a",
      name: "Alpha",
      description: "Moon & Sun",
      creatorId: "owner",
      visibility: "public",
      heroCount: 3,
      heroLevel: 7,
      createdAt: "2026-09-03T12:00:00.000Z",
    },
    {
      id: "m",
      name: "Middle",
      creatorId: "other",
      visibility: "public",
      createdAt: "2026-09-01T12:00:00.000Z",
    },
    {
      id: "z",
      name: "Zulu",
      creatorId: "owner",
      visibility: "public",
      createdAt: "2026-09-02T12:00:00.000Z",
    },
    {
      id: "private",
      name: "Private",
      creatorId: "owner",
      visibility: "private",
    },
  ]);
  const { monsters } = validateOfficialMonstersJSON(
    JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
  );
  const input = parseJSONAPIMonster(monsters[0]);
  monsterId = (
    await createMonster({ ...input, visibility: "public" }, "owner-discord")
  ).id;
  hazardId = (
    await createHazard({ ...input, visibility: "public" }, "owner-discord")
  ).id;
  const privateId = (
    await createMonster({ ...input, visibility: "private" }, "owner-discord")
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
    { encounterId: "m", monsterId: privateId },
  ]);
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReset().mockReturnValue(db);
});
afterAll(() => client.close());

it.each([
  ["name", ["a", "m", "z"]],
  ["-name", ["z", "m", "a"]],
  ["createdAt", ["m", "z", "a"]],
  ["-createdAt", ["a", "z", "m"]],
])(
  "retains %s ordering, offset pagination, lookahead and empty final pages",
  async (sort, ids) => {
    const first = await (await request(`sort=${sort}&limit=2`)).json();
    const last = await (
      await request(`sort=${sort}&limit=2&pageParam=1`)
    ).json();
    expect(first.data.map((r: { id: string }) => r.id)).toEqual(
      ids.slice(0, 2)
    );
    expect(first.hasMore).toBe(true);
    expect(last.data.map((r: { id: string }) => r.id)).toEqual(ids.slice(2));
    expect(last.hasMore).toBe(false);
    expect(
      await (await request(`sort=${sort}&limit=2&pageParam=2`)).json()
    ).toEqual({ data: [], hasMore: false });
  }
);

it("preserves public overview fields and memberships, never private rows or private monsters", async () => {
  const response = await request(
    "creatorId=owner&search=Moon+%26+Sun&userId=other&includePrivate=true&visibility=private"
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
    description: "Moon & Sun",
    creator: { id: "owner", username: "owner" },
    visibility: "public",
    heroCount: 3,
    heroLevel: 7,
    createdAt: "2026-09-03T12:00:00.000Z",
  });
  expect(
    body.data[0].monsters
      .map((e: { monster: { id: string } }) => e.monster.id)
      .sort()
  ).toEqual([monsterId, hazardId].sort());
  expect(
    body.data[0].monsters.find(
      (e: { monster: { id: string } }) => e.monster.id === monsterId
    )
  ).toMatchObject({ quantity: 3, isPerHero: true, heroesPerMonster: 4 });
  expect(typeof body.data[0].monsters[0].monster.createdAt).toBe("string");
  expect(
    (await (await request("creatorId=other")).json()).data.map(
      (r: { id: string }) => r.id
    )
  ).toEqual(["m"]);
  expect(
    (await (await request("search=Middle")).json()).data[0].monsters
  ).toEqual([]);
  expect(
    await (
      await request("creatorId=owner&search=Private&includePrivate=true")
    ).json()
  ).toEqual({ data: [], hasMore: false });
});

it("handles exact-limit, missing creators and search misses", async () => {
  expect((await (await request("limit=3")).json()).hasMore).toBe(false);
  for (const query of [
    "creatorId=missing",
    "search=missing",
    "creatorId=%27+OR+1%3D1--",
  ])
    expect(await (await request(query)).json()).toEqual({
      data: [],
      hasMore: false,
    });
  expect((await request("limit=100")).status).toBe(200);
});

it.each([
  "sort=unknown",
  "sort=",
  "limit=0",
  "limit=101",
  "limit=1.5",
  "limit=x",
  "pageParam=-1",
  "pageParam=0.5",
  "pageParam=9007199254740991",
])("rejects invalid search before SQL: %s", async (query) => {
  getDatabase.mockImplementationOnce(() => {
    throw new Error("must not run");
  });
  const response = await request(query);
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("records unexpected failures and returns a generic error", async () => {
  const span = trace.getTracer("test").startSpan("encounter");
  const recordException = vi.spyOn(span, "recordException");
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  getDatabase.mockImplementationOnce(() => {
    throw new Error("secret database details");
  });
  const response = await request();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(recordException).toHaveBeenCalled();
});
