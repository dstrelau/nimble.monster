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
const expected = [
  { id: "c1", name: "Dazed", description: "First official", official: true },
  { id: "c3", name: "Frozen", description: "Second official", official: true },
];

beforeAll(async () => {
  await client.execute(
    "CREATE TABLE conditions(id text, name text, description text, official integer, creator_id text, created_at text, updated_at text)"
  );
});
beforeEach(async () => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
  await client.execute("DELETE FROM conditions");
  await client.execute(
    "INSERT INTO conditions VALUES('c1','Dazed','First official',1,'owner1','private-date','private-date'),('c2','Custom','Not official',0,'owner2','private-date','private-date'),('c3','Frozen','Second official',1,'owner2','private-date','private-date')"
  );
});
afterAll(() => client.close());

it("allows anonymous reads of only official Condition fields with no cache or CORS", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual(expected);
});

it("returns an empty array when no official conditions exist", async () => {
  await client.execute("DELETE FROM conditions WHERE official=1");
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([]);
});

it("records unexpected errors without disclosing database details", async () => {
  const span = {
    setStatus: vi.fn(),
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
    recordException: vi.fn(),
  };
  vi.spyOn(trace, "getActiveSpan").mockReturnValue({
    ...span,
    spanContext: vi.fn(),
    addEvent: vi.fn(),
    addLink: vi.fn(),
    addLinks: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: vi.fn(),
  });
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
