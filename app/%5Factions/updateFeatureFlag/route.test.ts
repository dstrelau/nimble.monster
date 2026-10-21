import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAdmin: vi.fn(),
  getUserById: vi.fn(),
  setFeatureFlag: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/lib/db/user", () => ({ getUserById: mocks.getUserById }));
vi.mock("@/lib/services/featureFlags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/featureFlags")>()),
  setFeatureFlag: mocks.setFeatureFlag,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { POST } from "./route";

const input = {
  userId: "target-user",
  feature: "monster-statblock-editor",
  enabled: true,
};

function request(body: unknown = input, origin = "https://nimble.nexus") {
  return new Request("https://nimble.nexus/_actions/updateFeatureFlag", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.isAdmin.mockResolvedValue(true);
  mocks.getUserById.mockResolvedValue({ id: input.userId });
});

describe("feature flag administration", () => {
  it.each([true, false])(
    "persists an explicit enabled=%s for the selected user",
    async (enabled) => {
      const response = await POST(request({ ...input, enabled }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(mocks.setFeatureFlag).toHaveBeenCalledWith(
        "target-user",
        "monster-statblock-editor",
        enabled
      );
    }
  );

  it("denies non-admins and cross-origin writes", async () => {
    mocks.isAdmin.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(403);
    mocks.isAdmin.mockResolvedValue(true);
    expect((await POST(request(input, "https://evil.example"))).status).toBe(
      403
    );
    expect(mocks.setFeatureFlag).not.toHaveBeenCalled();
  });

  it.each([
    { ...input, feature: "unregistered-flag" },
    { ...input, enabled: "false" },
    { ...input, enabled: null },
    { ...input, userId: "" },
    { userId: input.userId, feature: input.feature },
  ])("rejects invalid input: %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.setFeatureFlag).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and missing users", async () => {
    const malformed = request();
    vi.spyOn(malformed, "json").mockRejectedValue(
      new SyntaxError("Invalid JSON")
    );
    expect((await POST(malformed)).status).toBe(400);
    mocks.getUserById.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(404);
    expect(mocks.setFeatureFlag).not.toHaveBeenCalled();
  });

  it("does not expose database errors", async () => {
    mocks.setFeatureFlag.mockRejectedValue(
      new Error("private database details")
    );
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
