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

const { auth, findAncestry, getDatabase } = vi.hoisted(() => ({
  auth: vi.fn(),
  findAncestry: vi.fn(),
  getDatabase: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));
vi.mock("@/lib/services/ancestries/repository", () => ({ findAncestry }));

import { GET } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const id = "33333333-3333-3333-3333-333333333333";
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
const empty = { counts: { thumbs_up: 0, thumbs_down: 0 }, mine: [] };
const summary = {
  counts: { thumbs_up: 2, thumbs_down: 1 },
  mine: ["thumbs_up"],
};
function request(query = `entityType=monster&entityId=${id}`) {
  return new Request(`https://nimble.nexus/_actions/getMyReactions?${query}`);
}

beforeAll(async () => {
  await client.execute(
    "CREATE TABLE reactions(entity_type text, entity_id text, user_id text, reaction_type text, created_at text)"
  );
  for (const type of types) {
    for (const [user, reaction] of [
      ["owner", "thumbs_up"],
      ["other", "thumbs_down"],
      ["third", "thumbs_up"],
    ]) {
      await client.execute({
        sql: "INSERT INTO reactions VALUES(?,?,?,?,CURRENT_TIMESTAMP)",
        args: [type, id, user, reaction],
      });
    }
  }
});
afterAll(() => client.close());
beforeEach(() => {
  vi.resetAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner", discordId: "other" } });
  findAncestry.mockResolvedValue({ id });
});

describe("GET /_actions/getMyReactions", () => {
  it.each(types)(
    "reads %s counts and session-only mine, ignoring submitted identity",
    async (type) => {
      const response = await GET(
        request(`entityType=${type}&entityId=${id}&userId=other`)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain(
        "application/json"
      );
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.has("access-control-allow-origin")).toBe(false);
      expect(await response.json()).toEqual(summary);
      auth.mockResolvedValue({ user: { id: "other" } });
      expect(
        await (await GET(request(`entityType=${type}&entityId=${id}`))).json()
      ).toEqual({ ...summary, mine: ["thumbs_down"] });
    }
  );

  it("preserves the anonymous and hidden-ancestry empty summary", async () => {
    auth.mockResolvedValue(null);
    expect(await (await GET(request())).json()).toEqual(empty);
    auth.mockResolvedValue({ user: { id: "other" } });
    findAncestry.mockResolvedValue(null);
    expect(
      await (await GET(request(`entityType=ancestry&entityId=${id}`))).json()
    ).toEqual(empty);
  });

  it("returns an empty summary for a missing entity", async () => {
    expect(
      await (
        await GET(
          request(
            `entityType=monster&entityId=11111111-1111-1111-1111-111111111111`
          )
        )
      ).json()
    ).toEqual(empty);
  });

  it.each([
    "",
    `entityId=${id}`,
    "entityType=monster&entityId=bad",
    `entityType=hazard&entityId=${id}`,
    `entityType=users&entityId=${id}`,
  ])("rejects invalid query %s", async (query) => {
    const response = await GET(request(query));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does not expose unexpected failure details or cache failures", async () => {
    getDatabase.mockImplementation(() => {
      throw new Error("secret database details");
    });
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
