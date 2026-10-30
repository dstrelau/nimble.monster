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

beforeAll(async () => {
  await client.execute(
    "CREATE TABLE sources(id text, name text, abbreviation text NOT NULL, created_at text)"
  );
});
beforeEach(async () => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
  await client.execute("DELETE FROM sources");
});
afterAll(() => client.close());

it("returns all sources, including unreferenced options, sorted with only public fields", async () => {
  await client.execute(
    "INSERT INTO sources VALUES('z','Zulu','Z','internal'),('a','Alpha','A','internal'),('m','Middle','M','internal')"
  );
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual([
    { id: "a", name: "Alpha", abbreviation: "A" },
    { id: "m", name: "Middle", abbreviation: "M" },
    { id: "z", name: "Zulu", abbreviation: "Z" },
  ]);
});

it("returns an empty list when no sources exist", async () => {
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
