import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PUBLIC_ENCOUNTER_CONTENT_ERROR,
  UNAVAILABLE_ENCOUNTER_CONTENT_ERROR,
} from "@/lib/encounter-privacy";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  limit: vi.fn(),
  add: vi.fn(),
  revalidatePath: vi.fn(),
  errors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ addMonsterToEncounter: mocks.add }));
vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: mocks.limit }) }) }),
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
        mocks.errors(error);
        throw error;
      }
    },
}));

import { POST } from "./route";

const input = {
  monsterId: "11111111-1111-1111-1111-111111111111",
  encounterId: "22222222-2222-2222-2222-222222222222",
  quantity: 3,
  isPerHero: true,
  heroesPerMonster: 4,
};
function request(body: unknown = input, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/addMonsterToEncounter", {
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
  mocks.limit
    .mockResolvedValueOnce([{ id: input.encounterId }])
    .mockResolvedValueOnce([{ id: input.monsterId, legendary: false }]);
});
describe("encounter membership route", () => {
  it("adds or updates accessible content with counts and fresh caches", async () => {
    const response = await POST(
      request({ ...input, userId: "attacker", discordId: "attacker" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.add).toHaveBeenCalledWith(input);
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/my/encounters"],
      ["/encounters"],
      ["/encounters/[id]", "page"],
    ]);
  });
  it.each([null, { user: { id: "" } }])(
    "requires authentication",
    async (session) => {
      mocks.auth.mockResolvedValue(session);
      expect((await POST(request())).status).toBe(401);
      expect(mocks.add).not.toHaveBeenCalled();
    }
  );
  it("hides missing and non-owned encounters", async () => {
    mocks.limit.mockReset().mockResolvedValueOnce([]);
    expect((await POST(request())).status).toBe(404);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it("forbids inaccessible or missing content", async () => {
    mocks.limit
      .mockReset()
      .mockResolvedValueOnce([{ id: input.encounterId }])
      .mockResolvedValueOnce([]);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it.each([
    "{broken",
    {},
    { ...input, monsterId: "bad" },
    { ...input, encounterId: "bad" },
    { ...input, quantity: "3" },
    { ...input, isPerHero: "true" },
    { ...input, heroesPerMonster: null },
  ])("rejects malformed JSON/schema", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it("rejects origin/media mismatches before authentication", async () => {
    expect(
      (await POST(request(input, { origin: "https://evil.test" }))).status
    ).toBe(403);
    expect(
      (await POST(request(input, { "content-type": "text/plain" }))).status
    ).toBe(415);
    expect(mocks.auth).not.toHaveBeenCalled();
  });
  it.each([
    PUBLIC_ENCOUNTER_CONTENT_ERROR,
    UNAVAILABLE_ENCOUNTER_CONTENT_ERROR,
  ])("retains actionable privacy failures: %s", async (error) => {
    mocks.add.mockRejectedValue(new Error(error));
    const response = await POST(request());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it("defaults omitted counts and clamps counts below one", async () => {
    await POST(
      request({
        monsterId: input.monsterId,
        encounterId: input.encounterId,
        quantity: -2,
      })
    );
    expect(mocks.add).toHaveBeenCalledWith({
      ...input,
      quantity: 1,
      isPerHero: false,
      heroesPerMonster: 1,
    });
  });
  it("uses stored legendary status rather than client count authority", async () => {
    mocks.limit
      .mockReset()
      .mockResolvedValueOnce([{ id: input.encounterId }])
      .mockResolvedValueOnce([{ id: input.monsterId, legendary: true }]);
    await POST(request({ ...input, legendary: false }));
    expect(mocks.add).toHaveBeenCalledWith({
      ...input,
      quantity: 1,
      isPerHero: false,
    });
  });
  it("records unexpected failures without disclosing database details", async () => {
    const error = new Error("SQLITE_BUSY secret");
    mocks.add.mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mocks.errors).toHaveBeenCalledWith(error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
