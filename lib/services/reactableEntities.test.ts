import { afterEach, describe, expect, it, vi } from "vitest";

const mockSet = vi.fn(() => mockChain);
const mockWhere = vi.fn(() => Promise.resolve());
const mockChain = { set: mockSet, where: mockWhere };
const mockUpdate = vi.fn(() => mockChain);
const mockDb = { update: mockUpdate };

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: vi.fn(() => mockDb),
}));

import type { ReactableEntityType } from "@/lib/db/schema";
import {
  ancestries,
  backgrounds,
  classes,
  companions,
  items,
  monsters,
  spellSchools,
  subclasses,
} from "@/lib/db/schema";
import { syncLikeCount } from "./reactableEntities";

afterEach(() => {
  vi.clearAllMocks();
});

describe("syncLikeCount", () => {
  const cases: [ReactableEntityType, unknown][] = [
    ["monster", monsters],
    ["item", items],
    ["companion", companions],
    ["subclass", subclasses],
    ["class", classes],
    ["spellSchool", spellSchools],
    ["background", backgrounds],
    ["ancestry", ancestries],
  ];

  it.each(
    cases
  )("updates the %s table's like_count column", async (entityType, table) => {
    await syncLikeCount(entityType, "entity-1", 5);

    expect(mockUpdate).toHaveBeenCalledWith(table);
    expect(mockSet).toHaveBeenCalledWith({ likeCount: 5 });
  });
});
