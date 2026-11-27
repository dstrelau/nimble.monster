import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils/slug";
import { HAZARD_CARD_CASES } from "./fixtures";

describe("hazard card fixtures", () => {
  it("uses unique UUIDs, which cards require to build their links", () => {
    const ids = HAZARD_CARD_CASES.map(({ hazard }) => hazard.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const { hazard } of HAZARD_CARD_CASES) {
      expect(() => slugify(hazard)).not.toThrow();
    }
  });
});
