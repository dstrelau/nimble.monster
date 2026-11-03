import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  setFeatureFlag: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/services/featureFlags", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/services/featureFlags")>()),
  setFeatureFlag: mocks.setFeatureFlag,
}));

import { POST } from "./route";

const input = { feature: "monster-card-layout", enabled: true };

function request(body: unknown = input, origin = "https://nimble.nexus") {
  return new Request("https://nimble.nexus/_actions/updateMyFeatureFlag", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "owner" } });
});

describe("self-service feature flags", () => {
  it.each([
    ["monster-card-layout", true],
    ["monster-card-layout", false],
    ["monster-custom-artwork", true],
  ])(
    "sets %s enabled=%s for the session user only",
    async (feature, enabled) => {
      const response = await POST(
        request({ feature, enabled, userId: "other" })
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(mocks.setFeatureFlag).toHaveBeenCalledWith(
        "owner",
        feature,
        enabled
      );
    }
  );

  it("requires a session and a same-origin request", async () => {
    expect((await POST(request(input, "https://evil.example"))).status).toBe(
      403
    );
    mocks.auth.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.setFeatureFlag).not.toHaveBeenCalled();
  });

  it.each([
    { ...input, feature: "monster-statblock-editor" },
    { ...input, feature: "unregistered-flag" },
    { ...input, enabled: "true" },
    { feature: input.feature },
  ])("rejects flags users may not set and invalid input: %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(mocks.setFeatureFlag).not.toHaveBeenCalled();
  });
});
