import { describe, expect, it } from "vitest";
import {
  baseReferenceSlug,
  diffSectionSlugs,
  validateSectionSlugs,
} from "./custom-rule";

const VALID = ["movement", "monster-armor", "combat-structure"];

describe("baseReferenceSlug", () => {
  it("returns the slug unchanged when there is no anchor", () => {
    expect(baseReferenceSlug("movement")).toBe("movement");
  });

  it("strips the #anchor suffix", () => {
    expect(baseReferenceSlug("movement#falling")).toBe("movement");
  });

  it("keeps only the part before the first #", () => {
    expect(baseReferenceSlug("a#b#c")).toBe("a");
  });
});

describe("validateSectionSlugs", () => {
  it("returns valid slugs unchanged", () => {
    expect(validateSectionSlugs(["movement", "monster-armor"], VALID)).toEqual([
      "movement",
      "monster-armor",
    ]);
  });

  it("accepts anchored slugs whose base is valid", () => {
    expect(validateSectionSlugs(["movement#falling"], VALID)).toEqual([
      "movement#falling",
    ]);
  });

  it("trims whitespace and drops empty entries", () => {
    expect(validateSectionSlugs(["  movement  ", "", "   "], VALID)).toEqual([
      "movement",
    ]);
  });

  it("dedupes while preserving order", () => {
    expect(
      validateSectionSlugs(["monster-armor", "movement", "movement"], VALID)
    ).toEqual(["monster-armor", "movement"]);
  });

  it("throws when a base slug is not a known reference entry", () => {
    expect(() => validateSectionSlugs(["not-a-rule"], VALID)).toThrow(
      /Unknown reference section/
    );
  });

  it("throws when an anchored slug's base is unknown", () => {
    expect(() => validateSectionSlugs(["bogus#falling"], VALID)).toThrow(
      /bogus#falling/
    );
  });

  it("returns an empty array for no input", () => {
    expect(validateSectionSlugs([], VALID)).toEqual([]);
  });
});

describe("diffSectionSlugs", () => {
  it("computes additions and removals", () => {
    expect(
      diffSectionSlugs(["movement", "monster-armor"], ["movement", "combat"])
    ).toEqual({ toAdd: ["combat"], toRemove: ["monster-armor"] });
  });

  it("is a no-op when unchanged", () => {
    expect(diffSectionSlugs(["movement"], ["movement"])).toEqual({
      toAdd: [],
      toRemove: [],
    });
  });

  it("handles going from empty to populated", () => {
    expect(diffSectionSlugs([], ["movement", "combat"])).toEqual({
      toAdd: ["movement", "combat"],
      toRemove: [],
    });
  });

  it("handles clearing all links", () => {
    expect(diffSectionSlugs(["movement", "combat"], [])).toEqual({
      toAdd: [],
      toRemove: ["movement", "combat"],
    });
  });
});
