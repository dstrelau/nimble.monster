import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

const { auth, getDatabase, revalidatePath } = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { POST } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });
const input = {
  name: "Asymmetric award",
  abbreviation: "A & B 27",
  description: "Markdown **retained** 雪",
  url: "https://example.com/awards?a=1&b=2",
  color: "purple",
  icon: "trophy",
};
const request = (body: unknown = input, headers = {}) =>
  new Request("https://example.com/_actions/createAward", {
    method: "POST",
    headers: {
      Origin: "https://example.com",
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeAll(async () => {
  await client.execute(`CREATE TABLE awards (
    id text PRIMARY KEY, name text NOT NULL, abbreviation text NOT NULL,
    description text, slug text NOT NULL UNIQUE, url text NOT NULL,
    color text NOT NULL, icon text NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP, updated_at text DEFAULT CURRENT_TIMESTAMP
  )`);
});
beforeEach(async () => {
  vi.clearAllMocks();
  getDatabase.mockReturnValue(db);
  auth.mockResolvedValue({ user: { id: "qa-admin", role: "admin" } });
  await client.execute("DELETE FROM awards");
});
afterAll(() => client.close());

it("creates exactly the supplied award, deriving its slug and ignoring submitted identity", async () => {
  const response = await POST(
    request({ ...input, role: "user", id: "forged", slug: "forged" })
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(response.headers.has("access-control-allow-origin")).toBe(false);
  expect(await response.json()).toEqual({ success: true });
  const rows = (await client.execute("SELECT * FROM awards")).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ ...input, slug: "a-b-27" });
  expect(rows[0].id).not.toBe("forged");
  expect(revalidatePath).toHaveBeenCalledWith("/admin/awards");
});

it("denies anonymous and non-admin callers without writing", async () => {
  for (const [session, status] of [
    [null, 401],
    [{ user: { id: "user", role: null } }, 403],
  ]) {
    auth.mockResolvedValue(session);
    expect((await POST(request({ ...input, role: "admin" }))).status).toBe(
      status
    );
  }
  expect((await client.execute("SELECT * FROM awards")).rows).toHaveLength(0);
});

it("rejects origin, media, malformed JSON and invalid fields without writing", async () => {
  for (const [body, headers, status] of [
    [input, { Origin: "https://evil.example" }, 403],
    [input, { "Content-Type": "text/plain" }, 415],
    ["{", {}, 400],
    [{ ...input, name: "" }, {}, 400],
    [{ ...input, abbreviation: "" }, {}, 400],
    [{ ...input, url: "not-a-url" }, {}, 400],
    [{ ...input, icon: null }, {}, 400],
  ] as const) {
    expect((await POST(request(body, headers))).status).toBe(status);
  }
  expect((await client.execute("SELECT * FROM awards")).rows).toHaveLength(0);
});

it("returns a safe conflict on duplicate slugs, leaving the original unchanged", async () => {
  await POST(request());
  const before = (await client.execute("SELECT * FROM awards")).rows;
  const response = await POST(
    request({ ...input, name: "Do not replace", abbreviation: "A-B-27" })
  );
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({
    error: "An award with this abbreviation already exists",
  });
  expect((await client.execute("SELECT * FROM awards")).rows).toEqual(before);
});

it("hides unexpected database details", async () => {
  getDatabase.mockImplementation(() => {
    throw new Error("private database details");
  });
  const response = await POST(request());
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
});
