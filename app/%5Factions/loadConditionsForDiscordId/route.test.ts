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
const first = {
  id: "c1",
  name: "Dazed",
  description: "First creator",
  official: false,
};
const second = {
  id: "c2",
  name: "Frozen",
  description: "Second creator",
  official: true,
};
const request = (query = "discordId=creator") =>
  new Request(
    `https://nimble.nexus/_actions/loadConditionsForDiscordId?${query}`
  );

beforeAll(async () => {
  await client.execute(
    "CREATE TABLE users(id text PRIMARY KEY, discord_id text)"
  );
  await client.execute(
    "CREATE TABLE conditions(id text, name text, description text, official integer, creator_id text, created_at text, updated_at text)"
  );
  await client.execute(
    "INSERT INTO users VALUES('u1','creator'),('u2','viewer'),('u3','empty')"
  );
  await client.execute(
    "INSERT INTO conditions VALUES('c1','Dazed','First creator',0,'u1','secret-date','secret-date'),('c2','Frozen','Second creator',1,'u2','secret-date','secret-date')"
  );
});
beforeEach(() => {
  vi.restoreAllMocks();
  getDatabase.mockReturnValue(db);
});
afterAll(() => client.close());

it("allows anonymous creator reads with only Condition fields, no cache or CORS", async () => {
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual([first]);
});

it("selects the requested creator rather than cookie or extra identity parameters", async () => {
  const req = request("discordId=viewer&userId=u1");
  req.headers.set("cookie", "authjs.session-token=irrelevant");
  expect(await (await GET(req)).json()).toEqual([second]);
  expect(await (await GET(request())).json()).toEqual([first]);
});

it.each(["", "unknown", "empty", "creator' OR 1=1 --"])(
  "returns an empty list for lookup %s",
  async (discordId) => {
    const response = await GET(
      request(new URLSearchParams({ discordId }).toString())
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  }
);

it("requires the lookup parameter", async () => {
  const response = await GET(request(""));
  expect(response.status).toBe(400);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
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
  const response = await GET(request());
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(span.recordException).toHaveBeenCalled();
});
