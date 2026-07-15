import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSelect = vi.fn(() => mockChain);
const mockFrom = vi.fn(() => mockChain);
const mockWhere = vi.fn(() => mockChain);
const mockGroupBy = vi.fn(() => mockChain);
const mockValues = vi.fn(() => mockChain);
const mockInsert = vi.fn(() => mockChain);
const mockDelete = vi.fn(() => mockChain);

const mockResultQueue: unknown[] = [];

const mockChain = {
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  groupBy: mockGroupBy,
  values: mockValues,
  insert: mockInsert,
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
  delete: mockDelete,
};

const { mockSyncLikeCount } = vi.hoisted(() => ({
  mockSyncLikeCount: vi.fn(),
}));

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: vi.fn(() => mockDb),
}));

vi.mock("@/lib/services/reactableEntities", () => ({
  syncLikeCount: mockSyncLikeCount,
}));

vi.mock("@/lib/db/schema", () => ({
  reactions: {
    entityType: "reactions.entity_type",
    entityId: "reactions.entity_id",
    userId: "reactions.user_id",
    reactionType: "reactions.reaction_type",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => ({ _type: "and", args })),
  eq: vi.fn((col: unknown, val: unknown) => ({ _type: "eq", col, val })),
  sql: Object.assign(
    vi.fn((strings: TemplateStringsArray) => ({
      _type: "sql",
      sql: strings.join(""),
    })),
    { raw: vi.fn() }
  ),
}));

import { getReactionsSummary, toggleReaction } from "./reactions";

const queueDb = (...values: unknown[]) => {
  mockResultQueue.push(...values);
};

beforeEach(() => {
  mockResultQueue.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getReactionsSummary", () => {
  it("zero-fills counts for reaction types with no rows", async () => {
    queueDb([], []);

    const result = await getReactionsSummary("monster", "m1", "u1");

    expect(result.counts).toEqual({
      thumbs_up: 0,
      thumbs_down: 0,
    });
    expect(result.mine).toEqual([]);
  });

  it("aggregates counts across multiple users reacting with the same type", async () => {
    queueDb([{ reactionType: "thumbs_up", count: 3 }], []);

    const result = await getReactionsSummary("item", "m1", "u1");

    expect(result.counts.thumbs_up).toBe(3);
  });

  it("returns multiple reaction types from one user independently in mine", async () => {
    queueDb(
      [
        { reactionType: "thumbs_up", count: 1 },
        { reactionType: "thumbs_down", count: 1 },
      ],
      [{ reactionType: "thumbs_up" }, { reactionType: "thumbs_down" }]
    );

    const result = await getReactionsSummary("monster", "m1", "u1");

    expect(result.counts.thumbs_up).toBe(1);
    expect(result.counts.thumbs_down).toBe(1);
    expect(result.mine).toEqual(
      expect.arrayContaining(["thumbs_up", "thumbs_down"])
    );
    expect(result.mine).toHaveLength(2);
  });
});

describe("toggleReaction", () => {
  it("inserts a row when none exists (delete affects nothing)", async () => {
    queueDb(
      { rowsAffected: 0 },
      { rowsAffected: 0 },
      { rowsAffected: 1 },
      [{ reactionType: "thumbs_up", count: 1 }],
      [{ reactionType: "thumbs_up" }]
    );

    const result = await toggleReaction("monster", "m1", "u1", "thumbs_up");

    expect(mockInsert).toHaveBeenCalled();
    expect(result.counts.thumbs_up).toBe(1);
    expect(result.mine).toEqual(["thumbs_up"]);
    expect(mockSyncLikeCount).toHaveBeenCalledWith("monster", "m1", 1);
  });

  it("deletes the row when it already exists, without inserting", async () => {
    queueDb({ rowsAffected: 1 }, [], []);

    const result = await toggleReaction("monster", "m1", "u1", "thumbs_up");

    expect(mockInsert).not.toHaveBeenCalled();
    expect(result.counts.thumbs_up).toBe(0);
    expect(result.mine).toEqual([]);
    expect(mockSyncLikeCount).toHaveBeenCalledWith("monster", "m1", 0);
  });

  it("removes the opposite reaction before inserting the new one", async () => {
    queueDb(
      { rowsAffected: 0 },
      { rowsAffected: 1 },
      { rowsAffected: 1 },
      [{ reactionType: "thumbs_down", count: 1 }],
      [{ reactionType: "thumbs_down" }]
    );

    const result = await toggleReaction("monster", "m1", "u1", "thumbs_down");

    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockValues).toHaveBeenCalledWith({
      entityType: "monster",
      entityId: "m1",
      userId: "u1",
      reactionType: "thumbs_down",
    });
    expect(result.mine).toEqual(["thumbs_down"]);
  });

  it("delegates like-count syncing to reactableEntities for any entity type", async () => {
    queueDb({ rowsAffected: 1 }, [], []);

    await toggleReaction("item", "i1", "u1", "thumbs_up");

    expect(mockSyncLikeCount).toHaveBeenCalledWith("item", "i1", 0);
  });

  it("double-toggle returns to the original zero state", async () => {
    // first toggle: add
    queueDb(
      { rowsAffected: 0 },
      { rowsAffected: 0 },
      { rowsAffected: 1 },
      [{ reactionType: "thumbs_up", count: 1 }],
      [{ reactionType: "thumbs_up" }]
    );
    const added = await toggleReaction("monster", "m1", "u1", "thumbs_up");
    expect(added.counts.thumbs_up).toBe(1);

    // second toggle: remove
    queueDb({ rowsAffected: 1 }, [], []);
    const removed = await toggleReaction("monster", "m1", "u1", "thumbs_up");
    expect(removed.counts.thumbs_up).toBe(0);
    expect(removed.mine).toEqual([]);
  });
});
