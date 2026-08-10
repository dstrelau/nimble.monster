import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => {
  const queuedRows: unknown[][] = [];
  let predicate: unknown;

  const tables = {
    adventures: {
      id: "adventures.id",
      userId: "adventures.user_id",
      name: "adventures.name",
      tagline: "adventures.tagline",
      summary: "adventures.summary",
      visibility: "adventures.visibility",
      createdAt: "adventures.created_at",
      updatedAt: "adventures.updated_at",
    },
    adventureNodes: { adventureId: "adventure_nodes.adventure_id" },
    encounters: { id: "encounters.id" },
    items: { id: "items.id" },
    monsters: { id: "monsters.id" },
    users: { id: "users.id" },
  };

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const matches = (row: unknown) => {
    if (!isRecord(predicate)) return true;
    const conditions =
      predicate.type === "and" && Array.isArray(predicate.args)
        ? predicate.args
        : [predicate];
    if (!Array.isArray(conditions)) return true;

    return conditions.every((condition) => {
      if (
        !isRecord(condition) ||
        !("column" in condition) ||
        !("value" in condition)
      ) {
        return true;
      }
      const adventure =
        isRecord(row) && isRecord(row.adventure) ? row.adventure : null;
      if (!adventure) return true;
      if (condition.column === tables.adventures.userId) {
        return adventure.userId === condition.value;
      }
      if (condition.column === tables.adventures.visibility) {
        return adventure.visibility === condition.value;
      }
      return true;
    });
  };

  const chain = {
    select: vi.fn(),
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn((nextPredicate: unknown) => {
      predicate = nextPredicate;
      return chain;
    }),
    orderBy: vi.fn(),
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable query mock
    then(
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) {
      const rows = queuedRows.shift() ?? [];
      const filteredRows = rows.filter(matches);
      predicate = undefined;
      return Promise.resolve(filteredRows).then(onFulfilled, onRejected);
    },
  };

  chain.select.mockReturnValue(chain);
  chain.from.mockReturnValue(chain);
  chain.innerJoin.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);

  return {
    chain,
    tables,
    getDatabase: vi.fn(() => ({ select: chain.select })),
    reset() {
      queuedRows.length = 0;
      predicate = undefined;
      vi.clearAllMocks();
    },
    queueRows(rows: unknown[]) {
      queuedRows.push(rows);
    },
  };
});

vi.mock("./drizzle", () => ({ getDatabase: mockState.getDatabase }));
vi.mock("./schema", () => mockState.tables);
vi.mock("./converters", () => ({
  toUser: (user: { id: string; username: string }) => user,
}));
vi.mock("./encounter", () => ({ findEncounterOverviewsByIds: vi.fn() }));
vi.mock("@/lib/services/items", () => ({ findItemsByIds: vi.fn() }));
vi.mock("@/lib/services/monsters", () => ({
  findBestiaryEntriesByIds: vi.fn(),
}));
vi.mock("@/lib/utils/validation", () => ({ isValidUUID: vi.fn() }));
vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ type: "and", args }),
  asc: (column: unknown) => ({ type: "asc", column }),
  count: () => ({ type: "count" }),
  eq: (column: unknown, value: unknown) => ({
    type: "eq",
    column,
    value,
  }),
  inArray: (column: unknown, values: unknown[]) => ({
    type: "inArray",
    column,
    values,
  }),
  or: (...args: unknown[]) => ({ type: "or", args }),
}));

import {
  listAdventuresForUser,
  listPublicAdventures,
  listPublicAdventuresForUser,
} from "./adventures";

const creator = (id: string) => ({
  id,
  username: id,
  discordId: `${id}-discord`,
  displayName: id,
});

const row = (id: string, userId: string, visibility: "public" | "private") => ({
  adventure: {
    id,
    userId,
    name: id,
    tagline: "",
    summary: "",
    visibility,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  creator: creator(userId),
});

beforeEach(() => {
  mockState.reset();
});

describe("adventure privacy-aware listings", () => {
  it("lists public adventures across all creators", async () => {
    mockState.queueRows([
      row("owner-public", "owner", "public"),
      row("owner-private", "owner", "private"),
      row("other-public", "other", "public"),
    ]);

    const result = await listPublicAdventures();

    expect(result.map((adventure) => adventure.id)).toEqual([
      "owner-public",
      "other-public",
    ]);
  });

  it("lists both owner visibilities but excludes other owners", async () => {
    mockState.queueRows([
      row("owner-public", "owner", "public"),
      row("owner-private", "owner", "private"),
      row("other-public", "other", "public"),
    ]);

    const result = await listAdventuresForUser("owner");

    expect(result.map((adventure) => adventure.id)).toEqual(
      expect.arrayContaining(["owner-private", "owner-public"])
    );
    expect(result).toHaveLength(2);
  });

  it("lists only public adventures for a profile", async () => {
    mockState.queueRows([
      row("owner-public", "owner", "public"),
      row("owner-private", "owner", "private"),
    ]);

    const result = await listPublicAdventuresForUser("owner");

    expect(result.map((adventure) => adventure.id)).toEqual(["owner-public"]);
  });
});
