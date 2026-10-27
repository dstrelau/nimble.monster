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
const entityTypes = [
  "monsters",
  "ancestries",
  "backgrounds",
  "classes",
  "subclasses",
  "spell_schools",
];

beforeAll(async () => {
  await client.execute(
    "CREATE TABLE sources(id text, name text, abbreviation text, created_at text)"
  );
  await client.execute(
    "INSERT INTO sources VALUES('shared','Alpha','A','internal'),('unused','Unused','U','internal')"
  );
  for (const entityType of entityTypes) {
    await client.execute(
      `CREATE TABLE ${entityType}(source_id text, is_public integer)`
    );
    await client.execute({
      sql: "INSERT INTO sources VALUES(?,?,?,'internal')",
      args: [entityType, `Zulu ${entityType}`, entityType],
    });
    await client.execute({
      sql: `INSERT INTO ${entityType} VALUES('shared',1),('shared',1),(?,0)`,
      args: [entityType],
    });
  }
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
});
afterAll(() => client.close());

it.each(entityTypes)(
  "anonymously returns only %s source options, sorted and deduplicated",
  async (entityType) => {
    const response = await GET(
      new Request(
        `https://nimble.nexus/_actions/getSourcesForEntityType?entityType=${entityType}&userId=spoofed`
      )
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    // Existing catalogue options include sources referenced by private rows,
    // but never serialize those rows, their owners or internal source metadata.
    expect(await response.json()).toEqual([
      { id: "shared", name: "Alpha", abbreviation: "A" },
      { id: entityType, name: `Zulu ${entityType}`, abbreviation: entityType },
    ]);
  }
);

it.each(["", "?entityType=", "?entityType=items", "?entityType=monsters%27--"])(
  "rejects missing or invalid entity type %s",
  async (query) => {
    const response = await GET(
      new Request(
        `https://nimble.nexus/_actions/getSourcesForEntityType${query}`
      )
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: expect.any(String) });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  }
);

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
  const response = await GET(
    new Request(
      "https://nimble.nexus/_actions/getSourcesForEntityType?entityType=classes"
    )
  );
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(span.recordException).toHaveBeenCalled();
});

it("returns an empty list when an entity type has no source references", async () => {
  await client.execute("DELETE FROM spell_schools");
  const response = await GET(
    new Request(
      "https://nimble.nexus/_actions/getSourcesForEntityType?entityType=spell_schools"
    )
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([]);
});
