import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSelect = vi.fn(() => mockChain);
const mockFrom = vi.fn(() => mockChain);
const mockInnerJoin = vi.fn(() => mockChain);
const mockOrderBy = vi.fn(() => mockChain);
const mockWhere = vi.fn(() => mockChain);
const mockLimit = vi.fn(() => mockChain);
const mockValues = vi.fn(() => mockChain);
const mockInsert = vi.fn(() => mockChain);
const mockOnConflictDoNothing = vi.fn(() => mockChain);

const mockResultQueue: unknown[] = [];

const mockChain = {
  select: mockSelect,
  from: mockFrom,
  innerJoin: mockInnerJoin,
  orderBy: mockOrderBy,
  where: mockWhere,
  limit: mockLimit,
  values: mockValues,
  insert: mockInsert,
  onConflictDoNothing: mockOnConflictDoNothing,
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
};

const { mockResolveEntities } = vi.hoisted(() => ({
  mockResolveEntities: vi.fn(),
}));

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: vi.fn(() => mockDb),
}));

vi.mock("@/lib/services/reactableEntities", () => ({
  resolveEntities: mockResolveEntities,
  ENTITY_TYPE_LABELS: { monster: "Monster", item: "Item" },
}));

vi.mock("@/lib/db/schema", () => ({
  reports: {
    id: "reports.id",
    entityType: "reports.entity_type",
    entityId: "reports.entity_id",
    userId: "reports.user_id",
    reason: "reports.reason",
    details: "reports.details",
    createdAt: "reports.created_at",
  },
  users: {
    id: "users.id",
    displayName: "users.display_name",
    username: "users.username",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => ({ _type: "and", args })),
  eq: vi.fn((col: unknown, val: unknown) => ({ _type: "eq", col, val })),
  desc: vi.fn((col: unknown) => ({ _type: "desc", col })),
}));

import { createReport, getAllReports, hasUserReported } from "./reports";

const queueDb = (...values: unknown[]) => {
  mockResultQueue.push(...values);
};

beforeEach(() => {
  mockResultQueue.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createReport", () => {
  it("inserts a report row with the given fields, ignoring duplicates", async () => {
    await createReport("monster", "m1", "u1", "spam", "looks like spam");

    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({
      entityType: "monster",
      entityId: "m1",
      userId: "u1",
      reason: "spam",
      details: "looks like spam",
    });
    expect(mockOnConflictDoNothing).toHaveBeenCalled();
  });
});

describe("hasUserReported", () => {
  it("returns false when no report exists", async () => {
    queueDb([]);

    const result = await hasUserReported("monster", "m1", "u1");

    expect(result).toBe(false);
  });

  it("returns true when a report already exists", async () => {
    queueDb([{ id: "r1" }]);

    const result = await hasUserReported("monster", "m1", "u1");

    expect(result).toBe(true);
  });
});

describe("getAllReports", () => {
  it("resolves entity name/url per entity type and merges into report rows", async () => {
    queueDb([
      {
        id: "r1",
        entityType: "monster",
        entityId: "m1",
        reporterName: "Reporter",
        reporterUsername: "reporter",
        reason: "spam",
        details: "",
        createdAt: "2026-07-14",
      },
      {
        id: "r2",
        entityType: "item",
        entityId: "i1",
        reporterName: "Reporter",
        reporterUsername: "reporter",
        reason: "other",
        details: "",
        createdAt: "2026-07-13",
      },
    ]);
    mockResolveEntities.mockImplementation(async (entityType: string) => {
      if (entityType === "monster") {
        return new Map([["m1", { name: "Goblin", url: "/monsters/goblin" }]]);
      }
      return new Map([["i1", { name: "Sword", url: "/items/sword" }]]);
    });

    const result = await getAllReports();

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      entityType: "monster",
      entityTypeLabel: "Monster",
      entityName: "Goblin",
      entityUrl: "/monsters/goblin",
      reason: "spam",
    });
    expect(result[1]).toMatchObject({
      entityType: "item",
      entityTypeLabel: "Item",
      entityName: "Sword",
      entityUrl: "/items/sword",
    });
  });

  it("drops reports whose entity no longer resolves (e.g. deleted)", async () => {
    queueDb([
      {
        id: "r1",
        entityType: "monster",
        entityId: "m1",
        reporterName: "Reporter",
        reporterUsername: "reporter",
        reason: "spam",
        details: "",
        createdAt: "2026-07-14",
      },
    ]);
    mockResolveEntities.mockResolvedValue(new Map());

    const result = await getAllReports();

    expect(result).toEqual([]);
  });
});
