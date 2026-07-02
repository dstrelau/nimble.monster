import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSelect = vi.fn(() => mockChain);
const mockFrom = vi.fn(() => mockChain);
const mockWhere = vi.fn(() => mockChain);
const mockInnerJoin = vi.fn(() => mockChain);
const mockOrderBy = vi.fn(() => mockChain);
const mockLimit = vi.fn(() => mockChain);
const mockValues = vi.fn(() => mockChain);
const mockSet = vi.fn(() => mockChain);
const mockInsert = vi.fn(() => mockChain);
const mockUpdate = vi.fn(() => mockChain);
const mockDelete = vi.fn(() => mockChain);

const mockResultQueue: unknown[] = [];

const mockChain = {
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  innerJoin: mockInnerJoin,
  orderBy: mockOrderBy,
  limit: mockLimit,
  values: mockValues,
  set: mockSet,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable to mock awaited query chains
  then(
    onFulfilled: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) {
    const value = mockResultQueue.length > 0 ? mockResultQueue.shift() : [];
    return Promise.resolve(value).then(onFulfilled, onRejected);
  },
};

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
};

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: vi.fn(() => mockDb),
}));

vi.mock("@/lib/db/schema", () => ({
  encounters: {
    id: "encounters.id",
    name: "encounters.name",
    creatorId: "encounters.creator_id",
    visibility: "encounters.visibility",
  },
  monsters: {
    id: "monsters.id",
    visibility: "monsters.visibility",
    userId: "monsters.user_id",
  },
  monstersEncounters: {
    encounterId: "monsters_encounters.encounter_id",
    monsterId: "monsters_encounters.monster_id",
    quantity: "monsters_encounters.quantity",
    isPerHero: "monsters_encounters.is_per_hero",
  },
  users: {
    id: "users.id",
    discordId: "users.discord_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => ({ _type: "and", args })),
  asc: vi.fn((col: unknown) => ({ _type: "asc", col })),
  eq: vi.fn((col: unknown, val: unknown) => ({ _type: "eq", col, val })),
  inArray: vi.fn((col: unknown, vals: unknown) => ({
    _type: "inArray",
    col,
    vals,
  })),
  or: vi.fn((...args: unknown[]) => ({ _type: "or", args })),
}));

vi.mock("@/lib/db/converters", () => ({
  toUser: vi.fn(),
}));

vi.mock("@/lib/services/monsters", () => ({
  findMonstersByIds: vi.fn(),
}));

vi.mock("@/lib/services/monsters/converters", () => ({
  toMonsterMini: vi.fn(),
}));

vi.mock("@/lib/utils/validation", () => ({
  isValidUUID: vi.fn(),
}));

import { eq, inArray } from "drizzle-orm";
import { toUser } from "@/lib/db/converters";
import { findMonstersByIds } from "@/lib/services/monsters";
import { toMonsterMini } from "@/lib/services/monsters/converters";
import type { Monster, MonsterMini } from "@/lib/services/monsters/types";
import type { User } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import {
  addMonsterToEncounter,
  createEncounter,
  deleteEncounter,
  deleteMonsterFromEncounter,
  getEncounter,
  getPublicEncounterById,
  listEncountersWithMonstersForUser,
  updateEncounter,
} from "./encounter";

const queueDb = (...values: unknown[]) => {
  mockResultQueue.push(...values);
};

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  discordId: "d1",
  username: "tester",
  displayName: "Tester",
  ...overrides,
});

const makeMini = (overrides: Partial<MonsterMini> = {}): MonsterMini => ({
  id: "m0",
  hp: 10,
  legendary: false,
  minion: false,
  level: "1",
  levelInt: 1,
  name: "Monster",
  size: "medium",
  armor: "none",
  visibility: "public",
  createdAt: new Date("2026-01-01"),
  ...overrides,
});

const makeMonster = (overrides: Partial<Monster> = {}): Monster => ({
  ...makeMini(),
  speed: 6,
  fly: 0,
  swim: 0,
  climb: 0,
  teleport: 0,
  burrow: 0,
  abilities: [],
  actions: [],
  actionPreface: "",
  families: [],
  creator: makeUser(),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

beforeEach(() => {
  mockResultQueue.length = 0;
  vi.mocked(isValidUUID).mockReturnValue(true);
  vi.mocked(toUser).mockImplementation((u) => makeUser({ id: u.id }));
  vi.mocked(toMonsterMini).mockImplementation((m) =>
    makeMini({ id: m.id, name: m.name })
  );
  vi.mocked(findMonstersByIds).mockResolvedValue([]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listEncountersWithMonstersForUser", () => {
  it("runs a single batched monster query and groups monsters per encounter", async () => {
    const user = { id: "user-1", discordId: "d1" };
    const encounterRows = [
      {
        id: "e1",
        name: "Alpha",
        description: "",
        visibility: "public",
        heroCount: 4,
        heroLevel: 1,
        createdAt: "2026-01-01",
      },
      {
        id: "e2",
        name: "Beta",
        description: "",
        visibility: "private",
        heroCount: 3,
        heroLevel: 2,
        createdAt: "2026-01-02",
      },
    ];
    const monsterLinks = [
      {
        encounterId: "e1",
        monster: { id: "m1", name: "Goblin" },
        quantity: 2,
        isPerHero: false,
      },
      {
        encounterId: "e2",
        monster: { id: "m2", name: "Orc" },
        quantity: 1,
        isPerHero: true,
      },
      {
        encounterId: "e1",
        monster: { id: "m3", name: "Rat" },
        quantity: 5,
        isPerHero: false,
      },
    ];

    queueDb([user], encounterRows, monsterLinks);

    const result = await listEncountersWithMonstersForUser("d1");

    // The monster-links query is the only one using innerJoin; N+1 would
    // invoke it once per encounter. Assert it ran exactly once and that the
    // single query fetched links for all encounter ids at once.
    expect(mockInnerJoin).toHaveBeenCalledTimes(1);
    expect(inArray).toHaveBeenCalledTimes(1);
    expect(vi.mocked(inArray).mock.calls[0][1]).toEqual(["e1", "e2"]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("e1");
    expect(result[0].monsters.map((m) => m.monster.id)).toEqual(["m1", "m3"]);
    expect(result[1].id).toBe("e2");
    expect(result[1].monsters.map((m) => m.monster.id)).toEqual(["m2"]);

    expect(toUser).toHaveBeenCalledWith(user);
    expect(result[0].creator.id).toBe("user-1");
    expect(findMonstersByIds).not.toHaveBeenCalled();
  });

  it("returns [] when the user is not found", async () => {
    queueDb([]);

    const result = await listEncountersWithMonstersForUser("missing");

    expect(result).toEqual([]);
    expect(mockInnerJoin).not.toHaveBeenCalled();
  });

  it("returns [] without the monster query when the user has no encounters", async () => {
    queueDb([{ id: "user-1", discordId: "d1" }], []);

    const result = await listEncountersWithMonstersForUser("d1");

    expect(result).toEqual([]);
    expect(mockInnerJoin).not.toHaveBeenCalled();
  });
});

describe("deleteEncounter", () => {
  it("returns false for an invalid UUID without querying", async () => {
    vi.mocked(isValidUUID).mockReturnValue(false);

    const result = await deleteEncounter({ id: "bad", discordId: "d1" });

    expect(result).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns false when the user is not found", async () => {
    queueDb([]);

    const result = await deleteEncounter({ id: "e1", discordId: "missing" });

    expect(result).toBe(false);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("returns false when nothing was deleted", async () => {
    queueDb([{ id: "user-1" }], { rowsAffected: 0 });

    const result = await deleteEncounter({ id: "e1", discordId: "d1" });

    expect(result).toBe(false);
  });

  it("returns true when a row was deleted", async () => {
    queueDb([{ id: "user-1" }], { rowsAffected: 1 });

    const result = await deleteEncounter({ id: "e1", discordId: "d1" });

    expect(result).toBe(true);
  });
});

describe("getEncounter", () => {
  it("returns null for an invalid UUID", async () => {
    vi.mocked(isValidUUID).mockReturnValue(false);

    const result = await getEncounter("bad", "d1");

    expect(result).toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns the owned encounter when the discordId matches the owner", async () => {
    const owned = {
      id: "e1",
      name: "Owned",
      description: "",
      visibility: "private",
      heroCount: 4,
      heroLevel: 1,
      createdAt: "2026-01-01",
    };
    queueDb(
      [{ id: "user-1" }],
      [{ encounter: owned, creator: { id: "user-1" } }],
      [{ monsterId: "m1", quantity: 2, isPerHero: false }]
    );
    vi.mocked(findMonstersByIds).mockResolvedValue([
      makeMonster({ id: "m1", name: "Goblin" }),
    ]);

    const result = await getEncounter("e1", "d1");

    expect(result?.name).toBe("Owned");
    expect(result?.monsters).toHaveLength(1);
    expect(result?.monsters[0].monster.id).toBe("m1");
    expect(findMonstersByIds).toHaveBeenCalledWith(["m1"]);
    expect(eq).not.toHaveBeenCalledWith("encounters.visibility", "public");
  });

  it("falls back to the public encounter when not owned", async () => {
    const pub = {
      id: "e1",
      name: "Public",
      description: "",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      createdAt: "2026-01-01",
    };
    queueDb(
      [{ id: "user-1" }],
      [],
      [{ encounter: pub, creator: { id: "owner" } }],
      [{ monsterId: "m2", quantity: 1, isPerHero: true }]
    );
    vi.mocked(findMonstersByIds).mockResolvedValue([
      makeMonster({ id: "m2", name: "Orc" }),
    ]);

    const result = await getEncounter("e1", "d1");

    expect(result?.name).toBe("Public");
    expect(eq).toHaveBeenCalledWith("encounters.visibility", "public");
  });
});

describe("updateEncounter", () => {
  const input = {
    id: "e1",
    discordId: "d1",
    name: "Updated",
    visibility: "public" as const,
    heroCount: 4,
    heroLevel: 1,
  };

  it("throws when the user is not found", async () => {
    queueDb([]);

    await expect(updateEncounter(input)).rejects.toThrow("User not found");
  });

  it("throws when the encounter is not owned", async () => {
    queueDb([{ id: "user-1" }], []);

    await expect(updateEncounter(input)).rejects.toThrow("Encounter not found");
  });
});

describe("getPublicEncounterById", () => {
  it("returns null for an invalid UUID", async () => {
    vi.mocked(isValidUUID).mockReturnValue(false);

    const result = await getPublicEncounterById("bad");

    expect(result).toBeNull();
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns the encounter when found", async () => {
    const enc = {
      id: "e1",
      name: "Public",
      description: "",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      createdAt: "2026-01-01",
    };
    queueDb(
      [{ encounter: enc, creator: { id: "owner" } }],
      [{ monsterId: "m1", quantity: 3, isPerHero: false }]
    );
    vi.mocked(findMonstersByIds).mockResolvedValue([
      makeMonster({ id: "m1", name: "Goblin" }),
    ]);

    const result = await getPublicEncounterById("e1");

    expect(result?.name).toBe("Public");
    expect(result?.monsters).toHaveLength(1);
  });
});

describe("createEncounter", () => {
  it("creates an encounter and returns the overview", async () => {
    const enc = {
      id: "e1",
      name: "New",
      description: "",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      createdAt: "2026-01-01",
    };
    queueDb([{ id: "user-1" }], undefined, [enc], []);

    const result = await createEncounter({
      discordId: "d1",
      name: "New",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(result.name).toBe("New");
    expect(result.monsters).toEqual([]);
  });

  it("throws when the user is not found", async () => {
    queueDb([]);

    await expect(
      createEncounter({
        discordId: "missing",
        name: "New",
        visibility: "public",
        heroCount: 4,
        heroLevel: 1,
      })
    ).rejects.toThrow("User not found");
  });
});

describe("addMonsterToEncounter", () => {
  it("inserts a new link when none exists", async () => {
    queueDb([], undefined);

    await addMonsterToEncounter({
      monsterId: "m1",
      encounterId: "e1",
      quantity: 2,
      isPerHero: false,
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates the existing link when one exists", async () => {
    queueDb([{ monsterId: "m1", encounterId: "e1" }], undefined);

    await addMonsterToEncounter({
      monsterId: "m1",
      encounterId: "e1",
      quantity: 5,
      isPerHero: true,
    });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe("deleteMonsterFromEncounter", () => {
  it("returns false for an invalid UUID without querying", async () => {
    vi.mocked(isValidUUID).mockReturnValue(false);

    const result = await deleteMonsterFromEncounter("bad", "m1", "d1");

    expect(result).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("returns true when a link was deleted", async () => {
    queueDb([{ id: "user-1" }], [{ id: "e1" }], { rowsAffected: 1 });

    const result = await deleteMonsterFromEncounter("e1", "m1", "d1");

    expect(result).toBe(true);
  });
});
