import { afterEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockGetSummary, mockToggle } = vi.hoisted(() => ({
  mockGetSummary: vi.fn(),
  mockToggle: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/services/reactions", () => ({
  getReactionsSummary: mockGetSummary,
  toggleReaction: mockToggle,
}));

import { getMyReactions, toggleMyReaction } from "./reactions";

const emptySummary = {
  counts: { thumbs_up: 0, thumbs_down: 0 },
  mine: [],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("getMyReactions", () => {
  it("returns a zeroed summary without calling the service when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getMyReactions("monster", "m1");

    expect(result).toEqual(emptySummary);
    expect(mockGetSummary).not.toHaveBeenCalled();
  });

  it("delegates to the service with the internal user id when authenticated", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", discordId: "discord-1" },
    });
    mockGetSummary.mockResolvedValue({
      counts: { thumbs_up: 1, thumbs_down: 0 },
      mine: ["thumbs_up"],
    });

    const result = await getMyReactions("monster", "m1");

    expect(mockGetSummary).toHaveBeenCalledWith("monster", "m1", "user-1");
    expect(result.counts.thumbs_up).toBe(1);
  });
});

describe("toggleMyReaction", () => {
  it("returns an error and does not call the service when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleMyReaction("monster", "m1", "thumbs_up");

    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockToggle).not.toHaveBeenCalled();
  });

  it("passes session.user.id (not discordId) to the service", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", discordId: "discord-1" },
    });
    mockToggle.mockResolvedValue(emptySummary);

    await toggleMyReaction("item", "i1", "thumbs_down");

    expect(mockToggle).toHaveBeenCalledWith(
      "item",
      "i1",
      "user-1",
      "thumbs_down"
    );
  });

  it("returns success with the fresh summary on toggle", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const summary = {
      counts: { thumbs_up: 0, thumbs_down: 1 },
      mine: ["thumbs_down"],
    };
    mockToggle.mockResolvedValue(summary);

    const result = await toggleMyReaction("monster", "m1", "thumbs_down");

    expect(result).toEqual({ success: true, data: summary });
  });
});
