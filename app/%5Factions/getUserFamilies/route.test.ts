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

const { auth, getDatabase } = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });

beforeAll(async () => {
  getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    {
      id: "owner",
      discordId: "discord-owner",
      username: "owner",
      displayName: "Owner",
      email: "private@example.com",
      refreshToken: "private-token",
    },
    { id: "other", discordId: "discord-other", username: "other" },
    { id: "empty", discordId: "discord-empty", username: "empty" },
  ]);
  await db.insert(schema.families).values([
    { id: "z", name: "Zulu public", creatorId: "owner" },
    {
      id: "a",
      name: "Alpha private",
      creatorId: "owner",
      visibility: "private",
      description: "Private description",
      abilities: [{ name: "Cooperation", description: "Shared ability" }],
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
  const monster = await createMonster(input, "discord-owner");
  await db.insert(schema.monstersFamilies).values([
    { familyId: "a", monsterId: monster.id },
    { familyId: "foreign", monsterId: monster.id },
  ]);
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner", discordId: "discord-owner" } });
});
afterAll(() => client.close());

it("returns only the session owner's sorted public/private overviews with abilities and counts", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual([
    {
      id: "a",
      name: "Alpha private",
      description: "Private description",
      visibility: "private",
      abilities: [
        {
          id: expect.any(String),
          name: "Cooperation",
          description: "Shared ability",
        },
      ],
      monsterCount: 1,
      creatorId: "discord-owner",
      creator: {
        id: "owner",
        discordId: "discord-owner",
        username: "owner",
        displayName: "Owner",
        imageUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
      },
    },
    {
      id: "z",
      name: "Zulu public",
      visibility: "public",
      abilities: [],
      monsterCount: 0,
      creatorId: "discord-owner",
      creator: {
        id: "owner",
        discordId: "discord-owner",
        username: "owner",
        displayName: "Owner",
        imageUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
      },
    },
  ]);
  auth.mockResolvedValue({ user: { id: "other", discordId: "discord-other" } });
  const other = await GET();
  expect(
    (await other.json()).map((family: { id: string }) => family.id)
  ).toEqual(["foreign"]);
});

it.each([null, { user: {} }, { user: { id: "owner" } }])(
  "rejects anonymous or incomplete sessions without disclosing families: %j",
  async (session) => {
    auth.mockResolvedValue(session);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  }
);

it("returns an empty list for an authenticated owner without families", async () => {
  auth.mockResolvedValue({ user: { id: "empty", discordId: "discord-empty" } });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([]);
});

it("records unexpected failures and returns a generic private JSON error", async () => {
  const span = {
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
    recordException: vi.fn(),
    spanContext: vi.fn(),
    addEvent: vi.fn(),
    addLink: vi.fn(),
    addLinks: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: vi.fn(),
  };
  vi.spyOn(trace, "getActiveSpan").mockReturnValue(span);
  getDatabase.mockImplementationOnce(() => {
    throw new Error("private database path");
  });
  const response = await GET();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(span.recordException).toHaveBeenCalled();
});
