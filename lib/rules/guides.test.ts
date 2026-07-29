import { describe, expect, it } from "vitest";
import { getValidRuleSlugs } from "./filesystem";
import { GUIDES, getGuide, getGuides } from "./guides";

describe("GUIDES", () => {
  it("only references existing rules", () => {
    const valid = getValidRuleSlugs();
    const missing = GUIDES.flatMap((g) =>
      g.ruleSlugs.filter((slug) => !valid.has(slug))
    );
    expect(missing).toEqual([]);
  });

  it("resolves each guide with a summary, chain, and link", () => {
    const guides = getGuides();
    expect(guides).toHaveLength(GUIDES.length);
    for (const guide of guides) {
      expect(guide.summary).not.toHaveLength(0);
      expect(guide.category.slug).toBe(guide.categorySlug);
      expect(guide.rules).toHaveLength(guide.ruleSlugs.length);
      expect(guide.href).toBe(`/rules/guide/${guide.slug}`);
    }
  });
});

describe("getGuide", () => {
  it("returns the rules in the curated order", () => {
    const guide = getGuide("taking-damage-and-dying");
    expect(guide?.rules.map((rule) => rule.slug)).toEqual(guide?.ruleSlugs);
    expect(guide?.rules[0].content).toBeTruthy();
  });

  it("returns null for an unknown slug", () => {
    expect(getGuide("nope")).toBeNull();
  });
});
