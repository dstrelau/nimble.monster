import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockListCollectionsWithMonstersForUser } = vi.hoisted(() => ({
  mockListCollectionsWithMonstersForUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));

const unauthorizedSentinel = Symbol("unauthorized");
vi.mock("next/navigation", () => ({
  unauthorized: vi.fn(() => {
    throw unauthorizedSentinel;
  }),
}));

vi.mock("@/lib/db", () => ({
  listCollectionsWithMonstersForUser: mockListCollectionsWithMonstersForUser,
}));

import { listOwnCollections } from "./collection";

const SESSION = {
  user: {
    id: "user-uuid",
    discordId: "discord-123",
  },
};

describe("listOwnCollections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws unauthorized when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(listOwnCollections()).rejects.toBe(unauthorizedSentinel);
  });

  it("returns collections for the user", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const cols = [{ id: "col-1" }];
    mockListCollectionsWithMonstersForUser.mockResolvedValue(cols);

    const result = await listOwnCollections();
    expect(result).toEqual({ success: true, collections: cols });
    expect(mockListCollectionsWithMonstersForUser).toHaveBeenCalledWith(
      "discord-123"
    );
  });
});
