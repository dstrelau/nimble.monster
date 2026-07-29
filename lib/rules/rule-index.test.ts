import { describe, expect, it } from "vitest";
import { getAllRules } from "./filesystem";
import { resolveRuleHierarchy, ruleUrl, variantParentUrl } from "./rule-index";

describe("ruleUrl", () => {
  it("is the flat slug under /rules", () => {
    expect(ruleUrl("conditions")).toBe("/rules/conditions");
  });

  it("builds a parent URL with the variant anchor", () => {
    expect(variantParentUrl("initiative", "quick-initiative")).toBe(
      "/rules/initiative#variant-quick-initiative"
    );
  });
});

describe("resolveRuleHierarchy", () => {
  const rules = getAllRules();
  const hierarchy = resolveRuleHierarchy(rules);

  it("separates rules, GM guidance, and reference", () => {
    expect(hierarchy.map(({ group }) => group.slug)).toEqual([
      "rules",
      "gm-guidance",
      "reference",
    ]);
  });

  it("preserves the curated rule and section order", () => {
    const fundamentals = hierarchy[0].categories[0];
    expect(fundamentals.category.slug).toBe("fundamentals");
    expect(fundamentals.sections[0].section.label).toBe(
      "Stats, Skills & Checks"
    );
    expect(fundamentals.sections[0].rules.map((rule) => rule.slug)).toEqual([
      "stats",
      "skills",
      "skill-checks",
      "advantage-disadvantage",
      "saves",
      "heroes-and-saves",
    ]);
  });

  it("assigns every non-variant rule exactly once and omits variants", () => {
    const indexed = hierarchy.flatMap(({ categories }) =>
      categories.flatMap(({ sections }) =>
        sections.flatMap(({ rules }) => rules.map((rule) => rule.slug))
      )
    );
    const expected = rules
      .filter((rule) => !rule.variantOf)
      .map((rule) => rule.slug)
      .sort();
    expect(indexed.toSorted()).toEqual(expected);
    expect(new Set(indexed).size).toBe(indexed.length);
  });
});
