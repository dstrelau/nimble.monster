import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const {
  mockDeleteCollection,
  mockCreateCollection,
  mockUpdateCollection,
  mockListCollectionsWithMonstersForUser,
  mockGetCollection,
  mockAddMonsterToCollection,
  mockAddItemToCollection,
  mockAddSpellSchoolToCollection,
  mockAddCompanionToCollection,
  mockAddAncestryToCollection,
  mockAddBackgroundToCollection,
  mockAddSubclassToCollection,
} = vi.hoisted(() => ({
  mockDeleteCollection: vi.fn(),
  mockCreateCollection: vi.fn(),
  mockUpdateCollection: vi.fn(),
  mockListCollectionsWithMonstersForUser: vi.fn(),
  mockGetCollection: vi.fn(),
  mockAddMonsterToCollection: vi.fn(),
  mockAddItemToCollection: vi.fn(),
  mockAddSpellSchoolToCollection: vi.fn(),
  mockAddCompanionToCollection: vi.fn(),
  mockAddAncestryToCollection: vi.fn(),
  mockAddBackgroundToCollection: vi.fn(),
  mockAddSubclassToCollection: vi.fn(),
}));

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));

// Mock for entity accessibility checks (getDatabase returns a chainable query builder)
const { mockGetDatabase, mockEntityAccessibleResult } = vi.hoisted(() => {
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
    mockEntityAccessibleResult: mockResult,
  };
});

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
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
  deleteCollection: mockDeleteCollection,
  createCollection: mockCreateCollection,
  updateCollection: mockUpdateCollection,
  listCollectionsWithMonstersForUser: mockListCollectionsWithMonstersForUser,
  getCollection: mockGetCollection,
  addMonsterToCollection: mockAddMonsterToCollection,
  addItemToCollection: mockAddItemToCollection,
  addSpellSchoolToCollection: mockAddSpellSchoolToCollection,
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
  addItemToCollection,
  addMonsterToCollection,
  addSpellSchoolToCollection,
  addSubclassToCollection,
  createCollection,
  deleteCollection,
  listOwnCollections,
  updateCollection,
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

describe("deleteCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteCollection("col-1");
    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockDeleteCollection).not.toHaveBeenCalled();
  });

  it("deletes and revalidates on success", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteCollection.mockResolvedValue(true);
    const result = await deleteCollection("col-1");
    expect(result).toEqual({ success: true, error: null });
    expect(mockDeleteCollection).toHaveBeenCalledWith({
      id: "col-1",
      discordId: "discord-123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/collections");
  });

  it("returns error when db returns false", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteCollection.mockResolvedValue(false);
    const result = await deleteCollection("col-1");
    expect(result.success).toBe(false);
  });

  it("handles foreign key constraint error", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteCollection.mockRejectedValue(
      new Error("SQLITE_CONSTRAINT: foreign key constraint failed")
    );
    const result = await deleteCollection("col-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("monsters associated");
  });

  it("handles generic error", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteCollection.mockRejectedValue(new Error("connection failed"));
    const result = await deleteCollection("col-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("error occurred");
  });
});

describe("createCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createCollection({
      name: "Test",
      visibility: "public",
    });
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });

  it("creates collection and revalidates", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const created = { id: "new-col", name: "Test" };
    mockCreateCollection.mockResolvedValue(created);

    const result = await createCollection({
      name: "Test",
      visibility: "public",
      description: "desc",
    });

    expect(result.success).toBe(true);
    expect(mockCreateCollection).toHaveBeenCalledWith({
      name: "Test",
      visibility: "public",
      description: "desc",
      discordId: "discord-123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/collections");
  });

  it("returns error on db failure", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockCreateCollection.mockRejectedValue(new Error("duplicate name"));
    const result = await createCollection({
      name: "Test",
      visibility: "public",
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("duplicate name");
  });
});

describe("updateCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateCollection("col-1", {
      name: "New",
      visibility: "public",
    });
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });

  it("returns error when collection not found", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockUpdateCollection.mockResolvedValue(null);
    const result = await updateCollection("col-1", {
      name: "New",
      visibility: "public",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("updates and revalidates on success", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const updated = { id: "col-1", name: "New" };
    mockUpdateCollection.mockResolvedValue(updated);

    const result = await updateCollection("col-1", {
      name: "New",
      visibility: "private",
    });

    expect(result.success).toBe(true);
    expect(mockUpdateCollection).toHaveBeenCalledWith({
      id: "col-1",
      name: "New",
      visibility: "private",
      description: undefined,
      discordId: "discord-123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/collections");
  });
});

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

// All add*ToCollection actions share the same structure. Test one thoroughly,
// then spot-check the others.
describe("addMonsterToCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws unauthorized when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(
      addMonsterToCollection(
        buildFormData({ monsterId: "m1", collectionId: "c1" })
      )
    ).rejects.toBe(unauthorizedSentinel);
  });

  it("returns error when missing params", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const result = await addMonsterToCollection(buildFormData({}));
    expect(result).toEqual({
      success: false,
      error: "Missing monsterId or collectionId",
    });
  });

  it("returns error when collection not found", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(null);
    const result = await addMonsterToCollection(
      buildFormData({ monsterId: "m1", collectionId: "c1" })
    );
    expect(result.success).toBe(false);
    expect(mockGetCollection).toHaveBeenCalledWith("c1", "discord-123");
  });

  it("throws forbidden when not the owner", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OTHER_COLLECTION);
    await expect(
      addMonsterToCollection(
        buildFormData({ monsterId: "m1", collectionId: "col-2" })
      )
    ).rejects.toBe(forbiddenSentinel);
  });

  it("throws forbidden when entity is not accessible", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    mockEntityAccessibleResult.mockResolvedValueOnce([]);
    await expect(
      addMonsterToCollection(
        buildFormData({ monsterId: "m1", collectionId: "col-1" })
      )
    ).rejects.toBe(forbiddenSentinel);
    expect(mockAddMonsterToCollection).not.toHaveBeenCalled();
  });

  it("adds monster to owned collection", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    const result = await addMonsterToCollection(
      buildFormData({ monsterId: "m1", collectionId: "col-1" })
    );
    expect(result).toEqual({ success: true });
    expect(mockAddMonsterToCollection).toHaveBeenCalledWith({
      monsterId: "m1",
      collectionId: "col-1",
    });
  });
});

describe("addItemToCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws unauthorized when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(
      addItemToCollection(buildFormData({ itemId: "i1", collectionId: "c1" }))
    ).rejects.toBe(unauthorizedSentinel);
  });

  it("returns error when missing params", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const result = await addItemToCollection(buildFormData({}));
    expect(result).toEqual({
      success: false,
      error: "Missing itemId or collectionId",
    });
  });

  it("throws forbidden when not the owner", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OTHER_COLLECTION);
    await expect(
      addItemToCollection(
        buildFormData({ itemId: "i1", collectionId: "col-2" })
      )
    ).rejects.toBe(forbiddenSentinel);
  });

  it("adds item to owned collection", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    const result = await addItemToCollection(
      buildFormData({ itemId: "i1", collectionId: "col-1" })
    );
    expect(result).toEqual({ success: true });
    expect(mockAddItemToCollection).toHaveBeenCalledWith({
      itemId: "i1",
      collectionId: "col-1",
    });
  });
});

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

describe("addSpellSchoolToCollection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds spell school to owned collection", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OWNED_COLLECTION);
    const result = await addSpellSchoolToCollection(
      buildFormData({ spellSchoolId: "ss1", collectionId: "col-1" })
    );
    expect(result).toEqual({ success: true });
    expect(mockAddSpellSchoolToCollection).toHaveBeenCalledWith({
      spellSchoolId: "ss1",
      collectionId: "col-1",
    });
  });

  it("uses discordId for ownership check", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockGetCollection.mockResolvedValue(OTHER_COLLECTION);
    await expect(
      addSpellSchoolToCollection(
        buildFormData({ spellSchoolId: "ss1", collectionId: "col-2" })
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
