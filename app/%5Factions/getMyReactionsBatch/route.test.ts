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
const a = "11111111-1111-1111-1111-111111111111";
const b = "22222222-2222-2222-2222-222222222222";
const none = "33333333-3333-3333-3333-333333333333";
const empty = { counts: { thumbs_up: 0, thumbs_down: 0 }, mine: [] };

function request(query: string) {
  return new Request(
    `https://nimble.nexus/_actions/getMyReactionsBatch?${query}`
  );
}

beforeAll(async () => {
  await client.execute(
    "CREATE TABLE reactions(entity_type text, entity_id text, user_id text, reaction_type text, created_at text)"
  );
  for (const [type, id, user, reaction] of [
    ["monster", a, "owner", "thumbs_up"],
    ["monster", a, "other", "thumbs_up"],
    ["monster", a, "third", "thumbs_down"],
    ["monster", b, "other", "thumbs_down"],
    // Same ID under another type must not leak into the monster batch.
    ["item", b, "owner", "thumbs_up"],
    ["ancestry", a, "owner", "thumbs_up"],
    ["ancestry", b, "owner", "thumbs_up"],
  ]) {
    await client.execute({
      sql: "INSERT INTO reactions VALUES(?,?,?,?,CURRENT_TIMESTAMP)",
      args: [type, id, user, reaction],
    });
  }
});
afterAll(() => client.close());
beforeEach(() => {
  vi.resetAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "owner" } });
  findAncestry.mockResolvedValue({ id: a });
});

describe("GET /_actions/getMyReactionsBatch", () => {
  it("returns each entity's counts and the session user's reactions", async () => {
    const response = await GET(
      request(`entityType=monster&entityIds=${a},${b},${none}&userId=other`)
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      [a]: { counts: { thumbs_up: 2, thumbs_down: 1 }, mine: ["thumbs_up"] },
      [b]: { counts: { thumbs_up: 0, thumbs_down: 1 }, mine: [] },
      [none]: empty,
    });
  });

  it("returns empty summaries for guests and hidden ancestries", async () => {
    auth.mockResolvedValue(null);
    expect(
      await (await GET(request(`entityType=monster&entityIds=${a}`))).json()
    ).toEqual({ [a]: empty });

    auth.mockResolvedValue({ user: { id: "owner" } });
    findAncestry.mockImplementation(async (id: string) =>
      id === a ? { id } : null
    );
    expect(
      await (
        await GET(request(`entityType=ancestry&entityIds=${a},${b}`))
      ).json()
    ).toEqual({
      [a]: { counts: { thumbs_up: 1, thumbs_down: 0 }, mine: ["thumbs_up"] },
      [b]: empty,
    });
  });

  it.each([
    `entityType=monster`,
    `entityType=monster&entityIds=`,
    `entityType=monster&entityIds=${a},bad`,
    `entityType=hazard&entityIds=${a}`,
    `entityType=monster&entityIds=${Array.from(
      { length: 101 },
      (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`
    ).join(",")}`,
  ])("rejects invalid query %#", async (query) => {
    const response = await GET(request(query));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
