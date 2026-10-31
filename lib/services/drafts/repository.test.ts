import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockReturning = vi.fn();
const mockOnConflictDoUpdate = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));
const mockInsert = vi.fn(() => ({ values: mockValues }));

const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({ where: mockDeleteWhere }));

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: () => ({
    insert: mockInsert,
    select: mockSelect,
    delete: mockDelete,
  }),
}));

vi.mock("@/lib/db/schema", () => ({
  drafts: {
    userId: "user_id",
    entityType: "entity_type",
    entityId: "entity_id",
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ _type: "and", args }),
  eq: (col: unknown, val: unknown) => ({ _type: "eq", col, val }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    _type: "sql",
    strings,
    values,
  }),
}));

import { deleteDraft, getDraft, upsertDraft } from "./repository";

afterEach(() => {
  vi.clearAllMocks();
});

describe("drafts repository", () => {
  describe("upsertDraft", () => {
    beforeEach(() => {
      mockReturning.mockResolvedValue([
        {
          id: "draft-1",
          userId: "user-1",
          entityType: "class",
          entityId: "__new__",
          data: { name: "Test" },
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01",
        },
      ]);
    });

    it("inserts a new draft", async () => {
      const result = await upsertDraft({
        userId: "user-1",
        entityType: "class",
        entityId: "__new__",
        data: { name: "Test" },
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        userId: "user-1",
        entityType: "class",
        entityId: "__new__",
        data: { name: "Test" },
      });
      expect(result.id).toBe("draft-1");
    });

    it("uses onConflictDoUpdate", async () => {
      await upsertDraft({
        userId: "user-1",
        entityType: "class",
        entityId: "__new__",
        data: { name: "Test" },
      });

      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target: ["user_id", "entity_type", "entity_id"],
        })
      );
    });
  });

  describe("getDraft", () => {
    it("returns the draft when found", async () => {
      const row = {
        id: "draft-1",
        userId: "user-1",
        entityType: "class",
        entityId: "__new__",
        data: { name: "Test" },
        createdAt: "2026-03-01",
        updatedAt: "2026-03-01",
      };
      mockLimit.mockResolvedValue([row]);

      const result = await getDraft({
        userId: "user-1",
        entityType: "class",
        entityId: "__new__",
      });

      expect(result).toEqual(row);
    });

    it("returns null when not found", async () => {
      mockLimit.mockResolvedValue([]);

      const result = await getDraft({
        userId: "user-1",
        entityType: "class",
        entityId: "__new__",
      });

      expect(result).toBeNull();
    });
  });

  describe("deleteDraft", () => {
    it("deletes the draft", async () => {
      mockDeleteWhere.mockResolvedValue(undefined);

      await deleteDraft({
        userId: "user-1",
        entityType: "class",
        entityId: "__new__",
      });

      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
