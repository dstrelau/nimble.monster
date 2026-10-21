import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getCollection: vi.fn(),
  addMonsterToCollection: vi.fn(),
  accessible: vi.fn(),
  revalidatePath: vi.fn(),
  telemetryErrors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  getCollection: mocks.getCollection,
  addMonsterToCollection: mocks.addMonsterToCollection,
}));
vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: () => ({
    select: () => ({
      from: () => ({ where: () => ({ limit: mocks.accessible }) }),
    }),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
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

const input = {
  monsterId: "11111111-1111-1111-1111-111111111111",
  collectionId: "22222222-2222-2222-2222-222222222222",
};
function request(body: unknown = input, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/addMonsterToCollection", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      ...headers,
    },
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner", discordId: "discord" } });
  mocks.getCollection.mockResolvedValue({ creator: { discordId: "discord" } });
  mocks.accessible.mockResolvedValue([{ id: input.monsterId }]);
});

describe("monster/hazard collection membership route", () => {
  it("adds accessible content to session-owned collections with fresh caches", async () => {
    const response = await POST(request({ ...input, discordId: "attacker" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.getCollection).toHaveBeenCalledWith(
      input.collectionId,
      "discord"
    );
    expect(mocks.addMonsterToCollection).toHaveBeenCalledWith(input);
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/my/collections"],
      ["/collections"],
      ["/collections/[id]", "page"],
    ]);
  });
  it.each([
    null,
    { user: { id: "" } },
  ])("requires authentication", async (session) => {
    mocks.auth.mockResolvedValue(session);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.addMonsterToCollection).not.toHaveBeenCalled();
  });
  it("returns 404 for an unavailable collection", async () => {
    mocks.getCollection.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(404);
    expect(mocks.addMonsterToCollection).not.toHaveBeenCalled();
  });
  it("forbids modifying another user's public collection", async () => {
    mocks.getCollection.mockResolvedValue({ creator: { discordId: "other" } });
    expect((await POST(request())).status).toBe(403);
    expect(mocks.addMonsterToCollection).not.toHaveBeenCalled();
  });
  it("forbids inaccessible or missing content", async () => {
    mocks.accessible.mockResolvedValue([]);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.addMonsterToCollection).not.toHaveBeenCalled();
  });
  it.each([
    "{broken",
    {},
    { ...input, monsterId: "invalid" },
    { ...input, collectionId: "invalid" },
  ])("rejects malformed JSON/schema", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.addMonsterToCollection).not.toHaveBeenCalled();
  });
  it("rejects origin/media mismatches before auth or writes", async () => {
    expect(
      (await POST(request(input, { origin: "https://evil.test" }))).status
    ).toBe(403);
    expect(
      (await POST(request(input, { "content-type": "text/plain" }))).status
    ).toBe(415);
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it("records unexpected failures without disclosing storage details", async () => {
    const error = new Error("SQLITE_BUSY secret");
    mocks.addMonsterToCollection.mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mocks.telemetryErrors).toHaveBeenCalledWith(error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
