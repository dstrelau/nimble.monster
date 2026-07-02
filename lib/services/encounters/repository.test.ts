import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let queryQueue: unknown[] = [];

const chain = {
  select: vi.fn(() => chain),
  from: vi.fn(() => chain),
  innerJoin: vi.fn(() => chain),
  where: vi.fn((..._args: unknown[]) => chain),
  orderBy: vi.fn(() => chain),
  limit: vi.fn(() => chain),
  offset: vi.fn(() => chain),
  // biome-ignore lint/suspicious/noThenProperty: thenable query-builder mock; awaiting a chain resolves the next queued result
  then: (
    onFulfilled?: (value: unknown) => unknown,
    onRejected?: (reason: unknown) => unknown
  ) => Promise.resolve(queryQueue.shift()).then(onFulfilled, onRejected),
};

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: () => ({ select: chain.select }),
}));

vi.mock("@/lib/db/schema", () => ({
  encounters: {
    id: "encounters.id",
    name: "encounters.name",
    description: "encounters.description",
    visibility: "encounters.visibility",
    heroCount: "encounters.heroCount",
    heroLevel: "encounters.heroLevel",
    creatorId: "encounters.creatorId",
    createdAt: "encounters.createdAt",
  },
  monsters: {
    id: "monsters.id",
    visibility: "monsters.visibility",
  },
  monstersEncounters: {
    encounterId: "monstersEncounters.encounterId",
    monsterId: "monstersEncounters.monsterId",
    quantity: "monstersEncounters.quantity",
    isPerHero: "monstersEncounters.isPerHero",
  },
  users: {
    id: "users.id",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ _type: "and", args }),
  or: (...args: unknown[]) => ({ _type: "or", args }),
  eq: (col: unknown, val: unknown) => ({ _type: "eq", col, val }),
  gt: (col: unknown, val: unknown) => ({ _type: "gt", col, val }),
  lt: (col: unknown, val: unknown) => ({ _type: "lt", col, val }),
  like: (col: unknown, val: unknown) => ({ _type: "like", col, val }),
  asc: (col: unknown) => ({ _type: "asc", col }),
  desc: (col: unknown) => ({ _type: "desc", col }),
  inArray: (col: unknown, val: unknown) => ({ _type: "inArray", col, val }),
}));

vi.mock("@/lib/utils/cursor", () => ({
  encodeCursor: vi.fn(() => "next-cursor"),
  decodeCursor: vi.fn(() => null),
}));

vi.mock("@/lib/utils/validation", () => ({
  isValidUUID: vi.fn(() => true),
}));

import { isValidUUID } from "@/lib/utils/validation";
import {
  findPublicEncounterById,
  listPublicEncounters,
  searchPublicEncounters,
} from "./repository";

const makeUserRow = (id: string) => ({
  id,
  discordId: "discord-1",
  username: "creator",
  displayName: "Creator",
  imageUrl: "https://example.com/avatar.png",
  avatar: null,
});

const makeMonsterRow = (id: string, name: string, visibility = "public") => ({
  id,
  name,
  hp: 10,
  hpPerHero: null,
  legendary: false,
  minion: false,
  level: "1",
  levelInt: 1,
  visibility,
  size: "medium",
  armor: "none",
  paperforgeId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  kind: "beast",
  role: null,
  bloodied: "",
  lastStand: "",
  speed: 6,
  fly: 0,
  swim: 0,
  climb: 0,
  teleport: 0,
  burrow: 0,
  saves: "",
  updatedAt: null,
  abilities: null,
  actions: null,
  actionPreface: null,
  moreInfo: null,
  peaceful: null,
  deadly: null,
  remixedFromId: null,
  isOfficial: false,
});

const makeEncounterRow = (id: string, name: string) => ({
  encounters: {
    id,
    name,
    description: "a fight",
    visibility: "public",
    heroCount: 4,
    heroLevel: 2,
    creatorId: "user-1",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  users: makeUserRow("user-1"),
});

const makeMonsterJoinRow = (
  encounterId: string,
  monster: ReturnType<typeof makeMonsterRow>
) => ({
  encounterId,
  monster,
  quantity: 2,
  isPerHero: false,
});

// Extract the eq predicates recorded inside the and(...) passed to the
// monster-join query's .where(). whereCallIndex identifies which .where call
// corresponds to the monster-join query (0-based across all where calls).
const monsterVisibilityFilterPresent = (whereCallIndex: number): boolean => {
  const arg = chain.where.mock.calls[whereCallIndex][0];
  if (
    !arg ||
    typeof arg !== "object" ||
    !("args" in arg) ||
    !Array.isArray((arg as { args: unknown[] }).args)
  ) {
    return false;
  }
  return (arg as { args: unknown[] }).args.some(
    (p) =>
      !!p &&
      typeof p === "object" &&
      "_type" in p &&
      (p as { _type: unknown })._type === "eq" &&
      "col" in p &&
      (p as { col: unknown }).col === "monsters.visibility" &&
      "val" in p &&
      (p as { val: unknown }).val === "public"
  );
};

beforeEach(() => {
  queryQueue = [];
  vi.mocked(isValidUUID).mockReturnValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("encounters repository", () => {
  describe("listPublicEncounters", () => {
    it("filters monster-join by public visibility (privacy regression)", async () => {
      queryQueue = [
        [makeEncounterRow("enc-1", "Alpha")],
        [makeMonsterJoinRow("enc-1", makeMonsterRow("mon-1", "Goblin"))],
      ];

      await listPublicEncounters({});

      // where calls: [0] encounter query, [1] monster-join query
      expect(monsterVisibilityFilterPresent(1)).toBe(true);
    });

    it("groups monsters by their own encounterId", async () => {
      queryQueue = [
        [makeEncounterRow("enc-1", "Alpha"), makeEncounterRow("enc-2", "Beta")],
        [
          makeMonsterJoinRow("enc-1", makeMonsterRow("mon-1", "Goblin")),
          makeMonsterJoinRow("enc-2", makeMonsterRow("mon-2", "Orc")),
          makeMonsterJoinRow("enc-1", makeMonsterRow("mon-3", "Kobold")),
        ],
      ];

      const result = await listPublicEncounters({});

      const alpha = result.encounters.find((e) => e.id === "enc-1");
      const beta = result.encounters.find((e) => e.id === "enc-2");
      expect(alpha?.monsters.map((m) => m.monster.name)).toEqual([
        "Goblin",
        "Kobold",
      ]);
      expect(beta?.monsters.map((m) => m.monster.name)).toEqual(["Orc"]);
    });

    it("returns empty result without querying monsters when no encounters", async () => {
      queryQueue = [[]];

      const result = await listPublicEncounters({});

      expect(result).toEqual({ encounters: [], nextCursor: null });
      // only the encounter query ran; monster query would have consumed a 2nd item
      expect(queryQueue).toHaveLength(0);
    });

    it("maps encounter fields onto the overview shape", async () => {
      queryQueue = [
        [makeEncounterRow("enc-1", "Alpha")],
        [makeMonsterJoinRow("enc-1", makeMonsterRow("mon-1", "Goblin"))],
      ];

      const result = await listPublicEncounters({});
      const enc = result.encounters[0];

      expect(enc.id).toBe("enc-1");
      expect(enc.name).toBe("Alpha");
      expect(enc.visibility).toBe("public");
      expect(enc.heroCount).toBe(4);
      expect(enc.heroLevel).toBe(2);
      expect(enc.creator.displayName).toBe("Creator");
      expect(enc.monsters).toHaveLength(1);
      expect(enc.monsters[0].monster.name).toBe("Goblin");
      expect(enc.monsters[0].quantity).toBe(2);
      expect(enc.createdAt).toEqual(new Date("2026-02-01T00:00:00.000Z"));
    });
  });

  describe("searchPublicEncounters", () => {
    const params = {
      sortBy: "name" as const,
      sortDirection: "asc" as const,
      limit: 10,
    };

    it("filters monster-join by public visibility (privacy regression)", async () => {
      queryQueue = [
        [makeEncounterRow("enc-1", "Alpha")],
        [makeMonsterJoinRow("enc-1", makeMonsterRow("mon-1", "Goblin"))],
      ];

      await searchPublicEncounters(params);

      expect(monsterVisibilityFilterPresent(1)).toBe(true);
    });

    it("returns [] without querying monsters when no encounters", async () => {
      queryQueue = [[]];

      const result = await searchPublicEncounters(params);

      expect(result).toEqual([]);
      expect(queryQueue).toHaveLength(0);
    });

    it("maps and groups results", async () => {
      queryQueue = [
        [makeEncounterRow("enc-1", "Alpha")],
        [makeMonsterJoinRow("enc-1", makeMonsterRow("mon-1", "Goblin"))],
      ];

      const result = await searchPublicEncounters(params);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("enc-1");
      expect(result[0].monsters[0].monster.name).toBe("Goblin");
    });
  });

  describe("findPublicEncounterById", () => {
    const validId = "11111111-1111-1111-1111-111111111111";

    it("returns null for an invalid UUID without querying", async () => {
      vi.mocked(isValidUUID).mockReturnValue(false);

      const result = await findPublicEncounterById("not-a-uuid");

      expect(result).toBeNull();
      expect(chain.select).not.toHaveBeenCalled();
    });

    it("filters monster-join by public visibility (privacy regression)", async () => {
      queryQueue = [
        [makeEncounterRow("enc-1", "Alpha")],
        [
          {
            monster: makeMonsterRow("mon-1", "Goblin"),
            quantity: 2,
            isPerHero: false,
          },
        ],
      ];

      await findPublicEncounterById(validId);

      expect(monsterVisibilityFilterPresent(1)).toBe(true);
    });

    it("returns null without querying monsters when not found", async () => {
      queryQueue = [[]];

      const result = await findPublicEncounterById(validId);

      expect(result).toBeNull();
      expect(queryQueue).toHaveLength(0);
    });

    it("maps a found encounter onto the overview shape", async () => {
      queryQueue = [
        [makeEncounterRow("enc-1", "Alpha")],
        [
          {
            monster: makeMonsterRow("mon-1", "Goblin"),
            quantity: 3,
            isPerHero: true,
          },
        ],
      ];

      const result = await findPublicEncounterById(validId);

      expect(result?.id).toBe("enc-1");
      expect(result?.name).toBe("Alpha");
      expect(result?.visibility).toBe("public");
      expect(result?.creator.displayName).toBe("Creator");
      expect(result?.monsters).toHaveLength(1);
      expect(result?.monsters[0].monster.name).toBe("Goblin");
      expect(result?.monsters[0].quantity).toBe(3);
      expect(result?.monsters[0].isPerHero).toBe(true);
    });
  });
});
