import { afterEach, describe, expect, it, vi } from "vitest";

const mockRows: unknown[][] = [];
const mockLimit = vi.fn(async () => mockRows.shift() ?? []);
const mockWhere = vi.fn(() => ({
  limit: mockLimit,
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable for awaited query chains
  then(onFulfilled: (value: unknown) => unknown) {
    return Promise.resolve(mockRows.shift() ?? []).then(onFulfilled);
  },
}));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockOnConflictDoUpdate = vi.fn();
const mockValues = vi.fn(() => ({
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));
const mockInsert = vi.fn(() => ({ values: mockValues }));

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: () => ({ select: mockSelect, insert: mockInsert }),
}));

vi.mock("@/lib/db/schema", () => ({
  userFeatureFlags: {
    userId: "user_id",
    feature: "feature",
    enabled: "enabled",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ _type: "and", args }),
  eq: (column: unknown, value: unknown) => ({ column, value }),
  sql: (strings: TemplateStringsArray) => strings.join(""),
}));

import {
  getEnabledFeatureFlags,
  isFeatureFlag,
  isFeatureFlagEnabled,
  setFeatureFlag,
} from "./featureFlags";

afterEach(() => {
  mockRows.length = 0;
  vi.clearAllMocks();
});

describe("feature flags", () => {
  it("recognizes registered feature names", () => {
    expect(isFeatureFlag("class-draft-autosave")).toBe(true);
    expect(isFeatureFlag("random-tables")).toBe(true);
    expect(isFeatureFlag("unknown-feature")).toBe(false);
  });

  it("returns only registered enabled features for a user", async () => {
    mockRows.push([
      { feature: "class-draft-autosave" },
      { feature: "random-tables" },
      { feature: "removed-feature" },
    ]);

    await expect(getEnabledFeatureFlags("user-1")).resolves.toEqual([
      "class-draft-autosave",
      "random-tables",
    ]);
  });

  it("does not query for an anonymous user", async () => {
    await expect(getEnabledFeatureFlags(undefined)).resolves.toEqual([]);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("checks a single flag without caching it", async () => {
    mockRows.push([{ enabled: true }]);

    await expect(
      isFeatureFlagEnabled("user-1", "class-draft-autosave")
    ).resolves.toBe(true);
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it("upserts a flag value", async () => {
    await setFeatureFlag("user-1", "class-draft-autosave", true);

    expect(mockValues).toHaveBeenCalledWith({
      userId: "user-1",
      feature: "class-draft-autosave",
      enabled: true,
    });
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: ["user_id", "feature"],
        set: expect.objectContaining({ enabled: true }),
      })
    );
  });
});
