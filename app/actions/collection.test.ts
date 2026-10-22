import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const { mockListCollectionsWithMonstersForUser } = vi.hoisted(() => ({
  mockListCollectionsWithMonstersForUser: vi.fn(),
}));

// Mock for entity accessibility checks (getDatabase returns a chainable query builder)
const { mockGetDatabase } = vi.hoisted(() => {
  const mockResult = vi.fn().mockResolvedValue([{ id: "entity" }]);
  const chain = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: mockResult,
  };
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  return {
    mockGetDatabase: vi.fn(() => chain),
  };
});

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase: mockGetDatabase }));
vi.mock("@/lib/db/schema", () => ({
  classes: { id: "c.id", visibility: "c.vis", userId: "c.uid" },
}));
vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((...args: unknown[]) => args),
  or: vi.fn((...args: unknown[]) => args),
}));

const unauthorizedSentinel = Symbol("unauthorized");
const forbiddenSentinel = Symbol("forbidden");
vi.mock("next/navigation", () => ({
  unauthorized: vi.fn(() => {
    throw unauthorizedSentinel;
  }),
  forbidden: vi.fn(() => {
    throw forbiddenSentinel;
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
