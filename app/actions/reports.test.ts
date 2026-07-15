import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockCreateReport, mockHasUserReported } = vi.hoisted(() => ({
  mockCreateReport: vi.fn(),
  mockHasUserReported: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/reports", () => ({
  createReport: mockCreateReport,
  hasUserReported: mockHasUserReported,
}));

import { getMyReport, reportEntity } from "./reports";

afterEach(() => {
  vi.clearAllMocks();
});

describe("reportEntity", () => {
  it("returns an error and does not create a report when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await reportEntity("monster", "m1", "spam", "");

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it("creates a report with the session user id when authenticated", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", discordId: "discord-1" },
    });

    const result = await reportEntity("item", "i1", "spam", "looks duplicated");

    expect(mockCreateReport).toHaveBeenCalledWith(
      "item",
      "i1",
      "user-1",
      "spam",
      "looks duplicated"
    );
    expect(result).toEqual({ success: true });
  });
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
