import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockHasUserReported } = vi.hoisted(() => ({
  mockHasUserReported: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/reports", () => ({
  hasUserReported: mockHasUserReported,
}));

import { getMyReport } from "./reports";

afterEach(() => {
  vi.clearAllMocks();
});

describe("getMyReport", () => {
  it("returns false without checking the service when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getMyReport("monster", "m1");

    expect(result).toBe(false);
    expect(mockHasUserReported).not.toHaveBeenCalled();
  });

  it("delegates to the service with the session user id when authenticated", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockHasUserReported.mockResolvedValue(true);

    const result = await getMyReport("monster", "m1");

    expect(mockHasUserReported).toHaveBeenCalledWith("monster", "m1", "user-1");
    expect(result).toBe(true);
  });
});
