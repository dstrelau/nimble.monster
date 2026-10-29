import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import * as schema from "@/lib/db/schema";

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
const id = "33333333-3333-3333-3333-333333333333";
const otherId = "44444444-4444-4444-4444-444444444444";
const types = [
  "monster",
  "item",
  "companion",
  "subclass",
  "class",
  "spellSchool",
  "background",
  "ancestry",
  "customRule",
  "collection",
  "adventure",
  "encounter",
];
function request(query = `entityType=monster&entityId=${id}`) {
  return new Request(`https://nimble.nexus/_actions/getMyReport?${query}`);
}

beforeAll(async () => {
  await client.execute(
    "CREATE TABLE reports(id text, entity_type text, entity_id text, user_id text)"
  );
  for (const type of types) {
    await client.execute({
      sql: "INSERT INTO reports VALUES(?,?,?,?)",
      args: [crypto.randomUUID(), type, id, "reporter"],
    });
  }
  await client.execute({
    sql: "INSERT INTO reports VALUES(?,?,?,?)",
    args: [crypto.randomUUID(), "item", otherId, "other"],
  });
});
afterAll(() => client.close());
beforeEach(() => {
  vi.resetAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "reporter", discordId: "other" } });
});

describe("GET /_actions/getMyReport", () => {
  it.each(types)(
    "returns only the session reporter's boolean for %s",
    async (entityType) => {
      const query = `entityType=${entityType}&entityId=${id}&userId=other&discordId=other`;
      const response = await GET(request(query));
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json"
      );
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.has("access-control-allow-origin")).toBe(false);
      expect(await response.json()).toBe(true);
      auth.mockResolvedValue({ user: { id: "other" } });
      expect(
        await (await GET(request(`${query}&ownerId=reporter`))).json()
      ).toBe(false);
    }
  );

  it("separates entity types, identifiers and missing entities", async () => {
    auth.mockResolvedValue({ user: { id: "other" } });
    expect(
      await (await GET(request(`entityType=item&entityId=${otherId}`))).json()
    ).toBe(true);
    expect(
      await (
        await GET(request(`entityType=monster&entityId=${otherId}`))
      ).json()
    ).toBe(false);
    expect(
      await (
        await GET(
          request(
            `entityType=item&entityId=11111111-1111-1111-1111-111111111111`
          )
        )
      ).json()
    ).toBe(false);
  });

  it.each([null, { user: {} }])(
    "preserves anonymous false without consulting report rows",
    async (session) => {
      auth.mockResolvedValue(session);
      getDatabase.mockImplementation(() => {
        throw new Error("Database must not be read");
      });
      const response = await GET(
        request(`entityType=monster&entityId=${id}&userId=reporter`)
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toBe(false);
    }
  );

  it.each([
    "",
    `entityId=${id}`,
    "entityType=item",
    `entityType=hazard&entityId=${id}`,
    `entityType=users&entityId=${id}`,
    "entityType=item&entityId=bad",
    "entityType=item&entityId=' OR 1=1 --",
  ])("rejects invalid query %s", async (query) => {
    const response = await GET(request(query));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("records unexpected failures without exposing or caching them", async () => {
    const error = new Error("secret database details");
    getDatabase.mockImplementation(() => {
      throw error;
    });
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(recordException).toHaveBeenCalledWith(error);
  });
});
