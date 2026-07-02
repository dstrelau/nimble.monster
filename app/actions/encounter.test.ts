import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
const {
  mockDeleteEncounter,
  mockCreateEncounter,
  mockUpdateEncounter,
  mockListEncountersWithMonstersForUser,
  mockAddMonsterToEncounter,
} = vi.hoisted(() => ({
  mockDeleteEncounter: vi.fn(),
  mockCreateEncounter: vi.fn(),
  mockUpdateEncounter: vi.fn(),
  mockListEncountersWithMonstersForUser: vi.fn(),
  mockAddMonsterToEncounter: vi.fn(),
}));

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));

// getDatabase returns a chainable query builder; `.limit` resolves the query.
// addMonsterToEncounter runs two sequential queries (ownership, then
// accessibility), both ending in `.limit`, so tests drive `mockLimit` with
// `mockResolvedValueOnce` in call order.
const { mockGetDatabase, mockLimit } = vi.hoisted(() => {
  const limit = vi.fn().mockResolvedValue([{ id: "row" }]);
  const chain = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit,
  };
  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  return {
    mockGetDatabase: vi.fn(() => chain),
    mockLimit: limit,
  };
});

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/db/drizzle", () => ({ getDatabase: mockGetDatabase }));
vi.mock("@/lib/db/schema", () => ({
  encounters: { id: "e.id", creatorId: "e.creatorId" },
  monsters: { id: "m.id", visibility: "m.vis", userId: "m.uid" },
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
  deleteEncounter: mockDeleteEncounter,
  createEncounter: mockCreateEncounter,
  updateEncounter: mockUpdateEncounter,
  listEncountersWithMonstersForUser: mockListEncountersWithMonstersForUser,
  addMonsterToEncounter: mockAddMonsterToEncounter,
}));

import {
  addMonsterToEncounter,
  createEncounter,
  deleteEncounter,
  listOwnEncounters,
  updateEncounter,
} from "./encounter";

const SESSION = {
  user: {
    id: "user-uuid",
    discordId: "discord-123",
  },
};

function buildFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

describe("deleteEncounter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteEncounter("enc-1");
    expect(result).toEqual({ success: false, error: "Not authenticated" });
    expect(mockDeleteEncounter).not.toHaveBeenCalled();
  });

  it("deletes and revalidates on success", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteEncounter.mockResolvedValue(true);
    const result = await deleteEncounter("enc-1");
    expect(result).toEqual({ success: true, error: null });
    expect(mockDeleteEncounter).toHaveBeenCalledWith({
      id: "enc-1",
      discordId: "discord-123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/encounters");
  });

  it("returns error when db returns false", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteEncounter.mockResolvedValue(false);
    const result = await deleteEncounter("enc-1");
    expect(result.success).toBe(false);
  });

  it("handles foreign key constraint error", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteEncounter.mockRejectedValue(
      new Error("SQLITE_CONSTRAINT: foreign key constraint failed")
    );
    const result = await deleteEncounter("enc-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("monsters associated");
  });

  it("handles generic error", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockDeleteEncounter.mockRejectedValue(new Error("connection failed"));
    const result = await deleteEncounter("enc-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("error occurred");
  });
});

describe("createEncounter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createEncounter({
      name: "Test",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
    });
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });

  it("creates encounter and revalidates", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const created = { id: "new-enc", name: "Test" };
    mockCreateEncounter.mockResolvedValue(created);

    const result = await createEncounter({
      name: "Test",
      visibility: "public",
      description: "desc",
      heroCount: 4,
      heroLevel: 3,
    });

    expect(result).toEqual({ success: true, encounter: created });
    expect(mockCreateEncounter).toHaveBeenCalledWith({
      name: "Test",
      visibility: "public",
      description: "desc",
      heroCount: 4,
      heroLevel: 3,
      discordId: "discord-123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/encounters");
  });

  it("returns error on db failure", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockCreateEncounter.mockRejectedValue(new Error("duplicate name"));
    const result = await createEncounter({
      name: "Test",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe("duplicate name");
  });
});

describe("updateEncounter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateEncounter("enc-1", {
      name: "New",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
    });
    expect(result).toEqual({ success: false, error: "Not authenticated" });
  });

  it("returns error when encounter not found", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockUpdateEncounter.mockResolvedValue(null);
    const result = await updateEncounter("enc-1", {
      name: "New",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("updates and revalidates on success", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const updated = { id: "enc-1", name: "New" };
    mockUpdateEncounter.mockResolvedValue(updated);

    const result = await updateEncounter("enc-1", {
      name: "New",
      visibility: "private",
      heroCount: 5,
      heroLevel: 2,
    });

    expect(result).toEqual({ success: true, encounter: updated });
    expect(mockUpdateEncounter).toHaveBeenCalledWith({
      id: "enc-1",
      name: "New",
      visibility: "private",
      description: undefined,
      heroCount: 5,
      heroLevel: 2,
      discordId: "discord-123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/my/encounters");
  });
});

describe("listOwnEncounters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws unauthorized when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(listOwnEncounters()).rejects.toBe(unauthorizedSentinel);
  });

  it("returns encounters for the user", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const encs = [{ id: "enc-1" }];
    mockListEncountersWithMonstersForUser.mockResolvedValue(encs);

    const result = await listOwnEncounters();
    expect(result).toEqual({ success: true, encounters: encs });
    expect(mockListEncountersWithMonstersForUser).toHaveBeenCalledWith(
      "discord-123"
    );
  });
});

describe("addMonsterToEncounter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws unauthorized when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(
      addMonsterToEncounter(
        buildFormData({ monsterId: "m1", encounterId: "e1" })
      )
    ).rejects.toBe(unauthorizedSentinel);
  });

  it("returns error when missing params", async () => {
    mockAuth.mockResolvedValue(SESSION);
    const result = await addMonsterToEncounter(buildFormData({}));
    expect(result).toEqual({
      success: false,
      error: "Missing monsterId or encounterId",
    });
  });

  it("returns error when encounter not owned", async () => {
    mockAuth.mockResolvedValue(SESSION);
    // ownership query returns no rows
    mockLimit.mockResolvedValueOnce([]);
    const result = await addMonsterToEncounter(
      buildFormData({ monsterId: "m1", encounterId: "e1" })
    );
    expect(result).toEqual({
      success: false,
      error: "Encounter not found or you don't have permission to update it",
    });
    expect(mockAddMonsterToEncounter).not.toHaveBeenCalled();
  });

  it("throws forbidden when monster is not accessible", async () => {
    mockAuth.mockResolvedValue(SESSION);
    // ownership ok, accessibility empty
    mockLimit.mockResolvedValueOnce([{ id: "e1" }]).mockResolvedValueOnce([]);
    await expect(
      addMonsterToEncounter(
        buildFormData({ monsterId: "m1", encounterId: "e1" })
      )
    ).rejects.toBe(forbiddenSentinel);
    expect(mockAddMonsterToEncounter).not.toHaveBeenCalled();
  });

  it("adds monster to owned encounter with parsed quantity/isPerHero", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockLimit
      .mockResolvedValueOnce([{ id: "e1" }])
      .mockResolvedValueOnce([{ id: "m1" }]);
    const result = await addMonsterToEncounter(
      buildFormData({
        monsterId: "m1",
        encounterId: "e1",
        quantity: "3",
        isPerHero: "true",
      })
    );
    expect(result).toEqual({ success: true });
    expect(mockAddMonsterToEncounter).toHaveBeenCalledWith({
      monsterId: "m1",
      encounterId: "e1",
      quantity: 3,
      isPerHero: true,
    });
  });

  it("clamps quantity to a minimum of 1 and defaults isPerHero to false", async () => {
    mockAuth.mockResolvedValue(SESSION);
    mockLimit
      .mockResolvedValueOnce([{ id: "e1" }])
      .mockResolvedValueOnce([{ id: "m1" }]);
    await addMonsterToEncounter(
      buildFormData({ monsterId: "m1", encounterId: "e1", quantity: "0" })
    );
    expect(mockAddMonsterToEncounter).toHaveBeenCalledWith({
      monsterId: "m1",
      encounterId: "e1",
      quantity: 1,
      isPerHero: false,
    });
  });
});
