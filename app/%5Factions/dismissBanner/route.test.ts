import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { afterAll, beforeEach, expect, it, vi } from "vitest";
import * as relations from "@/lib/db/relations";
import * as schema from "@/lib/db/schema";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getDatabase: vi.fn(),
  telemetryErrors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase: mocks.getDatabase }));
vi.mock("@/lib/telemetry", () => ({
  telemetry:
    (handler: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (error) {
        mocks.telemetryErrors(error);
        throw error;
      }
    },
}));

import { POST } from "./route";

const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema: { ...schema, ...relations } });
function request(body: unknown = {}, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/dismissBanner", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...headers,
    },
  });
}
async function preferences() {
  return (await client.execute("SELECT * FROM users ORDER BY id")).rows;
}
beforeEach(async () => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner" } });
  mocks.getDatabase.mockReturnValue(db);
  await client.execute("DROP TABLE IF EXISTS users");
  await client.execute(
    "CREATE TABLE users (id TEXT PRIMARY KEY, banner_dismissed INTEGER DEFAULT 0)"
  );
  await client.execute("INSERT INTO users(id) VALUES ('owner'), ('other')");
});
afterAll(() => client.close());

it("persists only the session owner's dismissal and is idempotent", async () => {
  for (let i = 0; i < 2; i++) {
    const response = await POST(
      request({ userId: "other", bannerDismissed: false })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ success: true });
    expect(await preferences()).toEqual([
      { id: "other", banner_dismissed: 0 },
      { id: "owner", banner_dismissed: 1 },
    ]);
  }
});

it.each([null, { user: { id: "" } }])("requires a session", async (session) => {
  mocks.auth.mockResolvedValue(session);
  const before = await preferences();
  expect((await POST(request())).status).toBe(401);
  expect(await preferences()).toEqual(before);
});

it.each(["{broken", null, [], false, 12])(
  "rejects invalid bodies",
  async (body) => {
    const before = await preferences();
    expect((await POST(request(body))).status).toBe(400);
    expect(await preferences()).toEqual(before);
  }
);

it("enforces origin and media type before authentication or writes", async () => {
  const before = await preferences();
  expect(
    (await POST(request({}, { origin: "https://evil.test" }))).status
  ).toBe(403);
  expect(
    (await POST(request({}, { "content-type": "text/plain" }))).status
  ).toBe(415);
  const missingOrigin = request();
  missingOrigin.headers.delete("origin");
  expect((await POST(missingOrigin)).status).toBe(403);
  expect(mocks.auth).not.toHaveBeenCalled();
  expect(await preferences()).toEqual(before);
});

it("records unexpected failures without exposing storage details", async () => {
  const before = await preferences();
  const error = new Error("private database details");
  mocks.getDatabase.mockImplementation(() => {
    throw error;
  });
  const response = await POST(request());
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal Server Error" });
  expect(mocks.telemetryErrors).toHaveBeenCalledWith(error);
  expect(await preferences()).toEqual(before);
});
