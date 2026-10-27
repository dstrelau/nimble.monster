import { readdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const tables = [
  "monsters",
  "companions",
  "ancestries",
  "backgrounds",
  "classes",
  "subclasses",
  "spell_schools",
  "items",
  "adventures",
  "encounters",
  "custom_rules",
  "random_tables",
];
const officialRules = readdirSync("data/rules").filter((file) =>
  file.endsWith(".mdx")
).length;

beforeAll(async () => {
  for (const table of tables) {
    await client.execute(
      `CREATE TABLE ${table}(visibility text, hazard integer DEFAULT 0)`
    );
  }
});
beforeEach(async () => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
  for (const table of tables) await client.execute(`DELETE FROM ${table}`);
});
afterAll(() => client.close());

it("returns all public catalogue totals, separates hazards, and excludes private content", async () => {
  for (const [index, table] of tables.entries()) {
    for (let i = 0; i <= index; i++) {
      await client.execute(`INSERT INTO ${table}(visibility) VALUES('public')`);
    }
    await client.execute(
      `INSERT INTO ${table}(visibility) VALUES('private'),('private')`
    );
  }
  await client.execute(
    "INSERT INTO monsters VALUES('public',1),('public',1),('public',1),('private',1)"
  );
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual({
    monsters: 1,
    hazards: 3,
    companions: 2,
    ancestries: 3,
    backgrounds: 4,
    classes: 5,
    subclasses: 6,
    spellSchools: 7,
    items: 8,
    adventures: 9,
    encounters: 10,
    rules: officialRules + 11,
    randomTables: 12,
  });
});

it("returns zeroes for empty tables while retaining filesystem rules", async () => {
  expect(await (await GET()).json()).toEqual({
    monsters: 0,
    hazards: 0,
    companions: 0,
    ancestries: 0,
    backgrounds: 0,
    classes: 0,
    subclasses: 0,
    spellSchools: 0,
    items: 0,
    adventures: 0,
    encounters: 0,
    rules: officialRules,
    randomTables: 0,
  });
});

it("records unexpected failures and returns a generic no-store error", async () => {
  const recordException = vi.fn();
  vi.spyOn(trace, "getActiveSpan").mockReturnValue({
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
  getDatabase.mockImplementation(() => {
    throw new Error("private database details");
  });
  const response = await GET();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(recordException).toHaveBeenCalled();
});
