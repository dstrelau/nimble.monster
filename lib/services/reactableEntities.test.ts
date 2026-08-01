import { afterEach, describe, expect, it, vi } from "vitest";

const mockSet = vi.fn(() => mockChain);
const mockWhere = vi.fn(() => Promise.resolve());
const mockChain = { set: mockSet, where: mockWhere };
const mockUpdate = vi.fn(() => mockChain);
const mockSelectWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));
const mockDb = { update: mockUpdate, select: mockSelect };

vi.mock("@/lib/db/drizzle", () => ({
  getDatabase: vi.fn(() => mockDb),
}));

import type { ReactableEntityType } from "@/lib/db/schema";
import {
  ancestries,
  backgrounds,
  classes,
  companions,
  customRules,
  items,
  monsters,
  spellSchools,
  subclasses,
} from "@/lib/db/schema";
import { resolveEntities, syncLikeCount } from "./reactableEntities";

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
    ["customRule", customRules],
  ];

  it.each(
    cases
  )("updates the %s table's like_count column", async (entityType, table) => {
    await syncLikeCount(entityType, "entity-1", 5);

    expect(mockUpdate).toHaveBeenCalledWith(table);
    expect(mockSet).toHaveBeenCalledWith({ likeCount: 5 });
  });
});

describe("resolveEntities customRule", () => {
  const ID = "11111111-1111-1111-1111-111111111111";

  it("resolves ids against the customRules table", async () => {
    mockSelectWhere.mockResolvedValue([{ id: ID, name: "Gritty Wounds" }]);

    const result = await resolveEntities("customRule", [ID]);

    expect(mockFrom).toHaveBeenCalledWith(customRules);
    const info = result.get(ID);
    expect(info?.name).toBe("Gritty Wounds");
    expect(info?.url).toContain("/custom-rules/");
  });

  it("drops ids with no matching custom rule", async () => {
    mockSelectWhere.mockResolvedValue([]);

    const result = await resolveEntities("customRule", [ID]);

    expect(result.has(ID)).toBe(false);
  });
});

describe("resolveEntities monster", () => {
  const ID = "11111111-1111-1111-1111-111111111111";

  it("uses the canonical hazard route for hazard-backed monster resources", async () => {
    mockSelectWhere.mockResolvedValue([
      { id: ID, name: "Goblin Pit Trap", hazard: true },
    ]);

    const result = await resolveEntities("monster", [ID]);

    expect(result.get(ID)?.url).toContain("/hazards/");
  });
});
