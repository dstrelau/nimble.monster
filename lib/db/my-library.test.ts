import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => {
  const queuedResults: unknown[][] = [];
  const wherePredicates: unknown[] = [];
  const tables = {
    adventures: {
      userId: "adventures.user_id",
      visibility: "adventures.visibility",
    },
    ancestries: {
      userId: "ancestries.user_id",
      visibility: "ancestries.visibility",
    },
    backgrounds: {
      userId: "backgrounds.user_id",
      visibility: "backgrounds.visibility",
    },
    classes: { userId: "classes.user_id", visibility: "classes.visibility" },
    collections: {
      creatorId: "collections.creator_id",
      visibility: "collections.visibility",
    },
    companions: {
      userId: "companions.user_id",
      visibility: "companions.visibility",
    },
    customRules: {
      userId: "custom_rules.user_id",
      visibility: "custom_rules.visibility",
    },
    encounters: {
      creatorId: "encounters.creator_id",
      visibility: "encounters.visibility",
    },
    families: {
      creatorId: "families.creator_id",
      visibility: "families.visibility",
    },
    items: { userId: "items.user_id", visibility: "items.visibility" },
    monsters: {
      userId: "monsters.user_id",
      visibility: "monsters.visibility",
      hazard: "monsters.hazard",
    },
    randomTables: {
      creatorId: "random_tables.user_id",
    },
    spellSchools: {
      userId: "spell_schools.user_id",
      visibility: "spell_schools.visibility",
    },
    subclasses: {
      userId: "subclasses.user_id",
      visibility: "subclasses.visibility",
    },
  };

  const chain = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn((predicate: unknown) => {
      wherePredicates.push(predicate);
      return chain;
    }),
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable query mock
    then(
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) {
      return Promise.resolve(queuedResults.shift() ?? []).then(
        onFulfilled,
        onRejected
      );
    },
  };

  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);

  return {
    tables,
    chain,
    wherePredicates,
    getDatabase: vi.fn(() => ({ select: chain.select })),
    reset() {
      queuedResults.length = 0;
      wherePredicates.length = 0;
      vi.clearAllMocks();
    },
    queueCounts(adventureCount: number, randomTableCount = 0) {
      for (let index = 0; index < 15; index += 1) {
        queuedResults.push([
          {
            count:
              index === 10
                ? adventureCount
                : index === 11
                  ? randomTableCount
                  : 0,
          },
        ]);
      }
    },
  };
});

vi.mock("./drizzle", () => ({ getDatabase: mockState.getDatabase }));
vi.mock("./schema", () => mockState.tables);
vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ type: "and", args }),
  count: () => ({ type: "count" }),
  eq: (column: unknown, value: unknown) => ({
    type: "eq",
    column,
    value,
  }),
}));

import { getMyLibraryCounts, getPublicLibraryCounts } from "./my-library";

beforeEach(() => {
  mockState.reset();
});

describe("adventure library counts", () => {
  it("counts an owner's public and private adventures", async () => {
    mockState.queueCounts(2, 3);

    const counts = await getMyLibraryCounts("owner", true);

    expect(counts.adventures).toBe(2);
    expect(counts["random-tables"]).toBe(3);
    expect(mockState.wherePredicates[10]).toEqual({
      type: "eq",
      column: mockState.tables.adventures.userId,
      value: "owner",
    });
  });

  it("does not query random tables when they are disabled", async () => {
    mockState.queueCounts(2, 3);

    const counts = await getMyLibraryCounts("owner");

    expect(counts["random-tables"]).toBe(0);
    expect(mockState.chain.from).not.toHaveBeenCalledWith(
      mockState.tables.randomTables
    );
  });

  it("counts only public adventures for a public profile", async () => {
    mockState.queueCounts(1);

    const counts = await getPublicLibraryCounts("owner");

    expect(counts.adventures).toBe(1);
    expect(mockState.wherePredicates[10]).toEqual({
      type: "and",
      args: [
        {
          type: "eq",
          column: mockState.tables.adventures.userId,
          value: "owner",
        },
        {
          type: "eq",
          column: mockState.tables.adventures.visibility,
          value: "public",
        },
      ],
    });
  });
});
