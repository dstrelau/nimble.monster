import { createClient } from "@libsql/client";
import { trace } from "@opentelemetry/api";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const { auth, getDatabase } = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const tables = [
  ["monster", "monsters"],
  ["item", "items"],
  ["companion", "companions"],
  ["subclass", "subclasses"],
  ["school", "spell_schools"],
  ["ancestry", "ancestries"],
  ["background", "backgrounds"],
];
const request = (query: string) =>
  new Request(`http://localhost/_actions/searchAwardEntities?${query}`);

beforeAll(async () => {
  for (const [, table] of tables) {
    await client.execute(
      `CREATE TABLE ${table} (id text, name text, visibility text)`
    );
    for (let index = 0; index < 12; index++) {
      await client.execute({
        sql: `INSERT INTO ${table} VALUES(?,?,?)`,
        args: [
          `${table}-${index}`,
          `Needle ${index}`,
          index % 2 ? "private" : "public",
        ],
      });
    }
    await client.execute(
      `INSERT INTO ${table} VALUES('other','Unrelated','private')`
    );
  }
});
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "admin", role: "admin" } });
  getDatabase.mockReturnValue(db);
});
afterAll(() => client.close());

it.each(tables)(
  "searches %s, including private entities, capped at ten minimal results",
  async (entityType, table) => {
    const response = await GET(
      request(
        new URLSearchParams({
          entityType,
          query: "NEEDLE",
          role: "user",
          limit: "100",
        }).toString()
      )
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual(
      Array.from({ length: 10 }, (_, index) => ({
        id: `${table}-${index}`,
        name: `Needle ${index}`,
      }))
    );
  }
);

it("retains empty/wildcard queries and safely binds special input", async () => {
  for (const query of ["", "%", "Needle _"]) {
    expect(
      (
        await (
          await GET(
            request(
              new URLSearchParams({ entityType: "item", query }).toString()
            )
          )
        ).json()
      ).length
    ).toBe(10);
  }
  for (const query of ["missing", "' OR 1=1 --", "a+b & 雪"]) {
    expect(
      await (
        await GET(
          request(new URLSearchParams({ entityType: "item", query }).toString())
        )
      ).json()
    ).toEqual([]);
  }
});

it("denies anonymous and non-admin readers before validation/SQL, ignoring submitted authority", async () => {
  for (const [session, status] of [
    [null, 401],
    [{ user: { id: "user", role: null } }, 403],
  ]) {
    auth.mockResolvedValue(session);
    const response = await GET(
      request("entityType=item&query=Needle&role=admin&userId=admin")
    );
    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  }
  expect(getDatabase).not.toHaveBeenCalled();
});

it.each([
  "",
  "entityType=item",
  "query=Needle",
  "entityType=class&query=Needle",
])("rejects invalid input %s", async (query) => {
  expect((await GET(request(query))).status).toBe(400);
  expect(getDatabase).not.toHaveBeenCalled();
});

it("records unexpected exceptions and returns a generic no-store failure", async () => {
  const recordException = vi.fn();
  vi.spyOn(trace, "getActiveSpan").mockReturnValue({
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
    recordException,
    spanContext: vi.fn(),
    addEvent: vi.fn(),
    addLink: vi.fn(),
    addLinks: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: () => true,
  });
  getDatabase.mockImplementation(() => {
    throw new Error("private SQL detail");
  });
  const response = await GET(request("entityType=item&query=Needle"));
  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(recordException).toHaveBeenCalled();
});
