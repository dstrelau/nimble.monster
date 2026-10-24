import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  deleteCondition: vi.fn(),
  revalidatePath: vi.fn(),
  telemetryErrors: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db/condition", () => ({
  deleteCondition: mocks.deleteCondition,
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

const id = "22222222-2222-2222-2222-222222222222";
function request(body: unknown = { id }, headers?: HeadersInit) {
  return new Request("http://localhost/_actions/deleteCondition", {
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
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: "owner", discordId: "owner-discord" },
  });
});

describe("condition deletion route", () => {
  it("uses session ownership and invalidates the owner layout", async () => {
    mocks.deleteCondition.mockResolvedValue({ id });
    const response = await POST(
      request({ id, discordId: "attacker", userId: "attacker" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.deleteCondition).toHaveBeenCalledWith(id, "owner-discord");
    expect(mocks.revalidatePath.mock.calls).toEqual([["/my", "layout"]]);
  });
  it("hides missing, non-owned and already-deleted conditions behind 404", async () => {
    mocks.deleteCondition.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Condition not found" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
  it.each([null, { user: { id: "" } }])(
    "requires a session user ID",
    async (session) => {
      mocks.auth.mockResolvedValue(session);
      expect((await POST(request())).status).toBe(401);
      expect(mocks.deleteCondition).not.toHaveBeenCalled();
    }
  );
  it.each(["{broken", { id: "invalid" }, {}, { id: null }])(
    "rejects malformed JSON/schema",
    async (body) => {
      expect((await POST(request(body))).status).toBe(400);
      expect(mocks.deleteCondition).not.toHaveBeenCalled();
    }
  );
  it("rejects origin/media mismatches before authentication or writes", async () => {
    expect(
      (await POST(request({ id }, { origin: "https://evil.test" }))).status
    ).toBe(403);
    expect(
      (await POST(request({ id }, { "content-type": "text/plain" }))).status
    ).toBe(415);
    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.deleteCondition).not.toHaveBeenCalled();
  });
  it("records unexpected failures without exposing storage details", async () => {
    const error = new Error("SQLITE_BUSY secret details");
    mocks.deleteCondition.mockRejectedValue(error);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
    expect(mocks.telemetryErrors).toHaveBeenCalledWith(error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
