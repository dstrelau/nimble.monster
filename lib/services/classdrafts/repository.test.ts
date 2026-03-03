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
  classDrafts: {
    userId: "user_id",
    classId: "class_id",
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

import {
  deleteClassDraft,
  getClassDraft,
  upsertClassDraft,
} from "./repository";

afterEach(() => {
  vi.clearAllMocks();
});

describe("classdrafts repository", () => {
  describe("upsertClassDraft", () => {
    beforeEach(() => {
      mockReturning.mockResolvedValue([
        {
          id: "draft-1",
          userId: "user-1",
          classId: "__new__",
          data: { name: "Test" },
          createdAt: "2026-03-01",
          updatedAt: "2026-03-01",
        },
      ]);
    });

    it("inserts a new draft", async () => {
      const result = await upsertClassDraft({
        userId: "user-1",
        classId: "__new__",
        data: { name: "Test" },
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        userId: "user-1",
        classId: "__new__",
        data: { name: "Test" },
      });
      expect(result.id).toBe("draft-1");
    });

    it("uses onConflictDoUpdate", async () => {
      await upsertClassDraft({
        userId: "user-1",
        classId: "__new__",
        data: { name: "Test" },
      });

      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target: ["user_id", "class_id"],
        })
      );
    });
  });

  describe("getClassDraft", () => {
    it("returns the draft when found", async () => {
      const row = {
        id: "draft-1",
        userId: "user-1",
        classId: "__new__",
        data: { name: "Test" },
        createdAt: "2026-03-01",
        updatedAt: "2026-03-01",
      };
      mockLimit.mockResolvedValue([row]);

      const result = await getClassDraft({
        userId: "user-1",
        classId: "__new__",
      });

      expect(result).toEqual(row);
    });

    it("returns null when not found", async () => {
      mockLimit.mockResolvedValue([]);

      const result = await getClassDraft({
        userId: "user-1",
        classId: "__new__",
      });

      expect(result).toBeNull();
    });
  });

  describe("deleteClassDraft", () => {
    it("deletes the draft", async () => {
      mockDeleteWhere.mockResolvedValue(undefined);

      await deleteClassDraft({ userId: "user-1", classId: "__new__" });

      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
