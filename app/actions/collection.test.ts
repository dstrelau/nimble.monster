import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const {
  mockListCollectionsWithMonstersForUser,
  mockGetCollection,
  mockAddCompanionToCollection,
  mockAddAncestryToCollection,
  mockAddBackgroundToCollection,
  mockAddSubclassToCollection,
} = vi.hoisted(() => ({
  mockListCollectionsWithMonstersForUser: vi.fn(),
  mockGetCollection: vi.fn(),
  mockAddCompanionToCollection: vi.fn(),
  mockAddAncestryToCollection: vi.fn(),
  mockAddBackgroundToCollection: vi.fn(),
  mockAddSubclassToCollection: vi.fn(),
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
  monsters: { id: "m.id", visibility: "m.vis", userId: "m.uid" },
  items: { id: "i.id", visibility: "i.vis", userId: "i.uid" },
  companions: { id: "c.id", visibility: "c.vis", userId: "c.uid" },
  ancestries: { id: "a.id", visibility: "a.vis", userId: "a.uid" },
  backgrounds: { id: "b.id", visibility: "b.vis", userId: "b.uid" },
  subclasses: { id: "s.id", visibility: "s.vis", userId: "s.uid" },
  spellSchools: { id: "ss.id", visibility: "ss.vis", userId: "ss.uid" },
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
  getCollection: mockGetCollection,
  addCompanionToCollection: mockAddCompanionToCollection,
  addAncestryToCollection: mockAddAncestryToCollection,
  addBackgroundToCollection: mockAddBackgroundToCollection,
  addSubclassToCollection: mockAddSubclassToCollection,
}));

vi.mock("@/lib/services/ancestries/repository", () => ({
  searchPublicAncestries: vi.fn(),
}));
vi.mock("@/lib/services/backgrounds/repository", () => ({
  searchPublicBackgrounds: vi.fn(),
}));
vi.mock("@/lib/services/companions/repository", () => ({
  searchPublicCompanions: vi.fn(),
}));

import {
  addAncestryToCollection,
  addBackgroundToCollection,
  addCompanionToCollection,
  addSubclassToCollection,
  listOwnCollections,
} from "./collection";

const SESSION = {
  user: {
    id: "user-uuid",
    discordId: "discord-123",
  },
};

const OWNED_COLLECTION = {
  id: "col-1",
  name: "My Collection",
  creator: { id: "user-uuid", discordId: "discord-123" },
};

const OTHER_COLLECTION = {
  id: "col-2",
  name: "Other Collection",
  creator: { id: "other-uuid", discordId: "discord-other" },
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

// Helper to build FormData for add-to-collection actions
function buildFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

describe("addCompanionToCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws unauthorized when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(
      addCompanionToCollection(
        buildFormData({ companionId: "c1", collectionId: "col-1" })
      )
    ).rejects.toBe(unauthorizedSentinel);
  });

  it("passes discordId to getCollection", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    await addCompanionToCollection(
      buildFormData({ companionId: "c1", collectionId: "col-1" })
    );
    expect(mockGetCollection).toHaveBeenCalledWith("col-1", "discord-123");
  });

  it("throws forbidden when not the owner", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OTHER_COLLECTION);
    await expect(
      addCompanionToCollection(
        buildFormData({ companionId: "c1", collectionId: "col-2" })
      )
    ).rejects.toBe(forbiddenSentinel);
  });
});

describe("addAncestryToCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes discordId to getCollection and adds ancestry", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    const result = await addAncestryToCollection(
      buildFormData({ ancestryId: "a1", collectionId: "col-1" })
    );
    expect(result).toEqual({ success: true });
    expect(mockGetCollection).toHaveBeenCalledWith("col-1", "discord-123");
    expect(mockAddAncestryToCollection).toHaveBeenCalledWith({
      ancestryId: "a1",
      collectionId: "col-1",
    });
  });
});

describe("addBackgroundToCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes discordId to getCollection and adds background", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    const result = await addBackgroundToCollection(
      buildFormData({ backgroundId: "b1", collectionId: "col-1" })
    );
    expect(result).toEqual({ success: true });
    expect(mockGetCollection).toHaveBeenCalledWith("col-1", "discord-123");
    expect(mockAddBackgroundToCollection).toHaveBeenCalledWith({
      backgroundId: "b1",
      collectionId: "col-1",
    });
  });
});

describe("addSubclassToCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes discordId to getCollection and adds subclass", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    const result = await addSubclassToCollection(
      buildFormData({ subclassId: "s1", collectionId: "col-1" })
    );
    expect(result).toEqual({ success: true });
    expect(mockGetCollection).toHaveBeenCalledWith("col-1", "discord-123");
    expect(mockAddSubclassToCollection).toHaveBeenCalledWith({
      subclassId: "s1",
      collectionId: "col-1",
    });
  });
});
