import { describe, expect, it } from "vitest";
import { CATEGORIES } from "./categories";
import {
  getAllRules,
  getRule,
  getRuleVariants,
  getValidRuleSlugs,
  parseRule,
  type Rule,
  validateRuleVariants,
} from "./filesystem";

const rawRule = (metadata = ""): string => `---
title: "Test Rule"
category: core-rules
${metadata}---
Rule content.
`;

describe("the rule corpus", () => {
  const rules = getAllRules();

  it("loads every rule with a title and a known category", () => {
    expect(rules.length).toBeGreaterThan(100);
    const known = new Set(CATEGORIES.map((c) => c.slug));
    for (const rule of rules) {
      expect(rule.title.trim()).not.toBe("");
      expect(known.has(rule.category)).toBe(true);
    }
  });

  it("has unique titles, so index rows are distinguishable", () => {
    const seen = new Map<string, string>();
    for (const rule of rules) {
      const key = rule.title.toLowerCase();
      expect(seen.get(key)).toBeUndefined();
      seen.set(key, rule.slug);
    }
  });

  it("resolves a rule by its flat slug", () => {
    expect(getRule("conditions")?.slug).toBe("conditions");
    expect(getRule("nope")).toBeNull();
  });

  it("consolidates conditions under core rules", () => {
    const conditions = getRule("conditions");
    expect(conditions?.category).toBe("core-rules");
    expect(conditions?.content).toContain("## Blind");
    expect(conditions?.content).toContain("## Wounded");
    expect(getRule("blinded")).toBeNull();
    expect(getRule("wounded")).toBeNull();
  });

  it("keeps consolidated stats and skills in core rules", () => {
    expect(getRule("stats")?.category).toBe("core-rules");
    expect(getRule("skills")?.category).toBe("core-rules");
    expect(getRule("skill-checks")?.category).toBe("core-rules");
    expect(getRule("stats")?.content).toContain("## Strength (STR)");
    expect(getRule("skills")?.content).toContain("## Finesse (DEX)");
  });

  it("splits GM guidance into useful categories", () => {
    const gmCategories = [
      "5e-conversion",
      "building-encounters",
      "building-monsters",
      "legendary-monsters",
    ];
    for (const category of gmCategories) {
      expect(
        rules.filter((rule) => rule.category === category).length
      ).toBeGreaterThanOrEqual(3);
    }
    expect(rules.some((rule) => rule.category === "gm-reference")).toBe(false);
  });

  it("keeps character creation in a few substantive rules", () => {
    const characterCreation = rules.filter(
      (rule) => rule.category === "character-creation"
    );
    expect(characterCreation.map((rule) => rule.slug).sort()).toEqual([
      "adventuring-motivation",
      "choose-your-class-ancestry-background",
      "leveling-up",
      "the-character-sheet",
    ]);
    expect(getRule("the-character-sheet")?.content).toContain(
      "## 7. Other Abilities"
    );
  });

  it("exposes every slug for custom-rule link validation", () => {
    expect(getValidRuleSlugs().size).toBe(rules.length);
  });
});

describe("rule provenance and variants", () => {
  it("parses typed sources and a variant parent", () => {
    const rule = parseRule(
      "test-rule",
      rawRule(`sources:
  - book: "Core Rules"
    pages: [14, 56]
  - book: "GMG"
    pages: [7]
variantOf: parent-rule
`)
    );
    expect(rule.sources).toEqual([
      { book: "Core Rules", pages: [14, 56] },
      { book: "GMG", pages: [7] },
    ]);
    expect(rule.variantOf).toBe("parent-rule");
  });

  it("keeps a known source book when its exact page is unknown", () => {
    const rule = parseRule(
      "test-rule",
      rawRule(`sources:
  - book: "GMG"
`)
    );
    expect(rule.sources).toEqual([{ book: "GMG" }]);
  });

  it.each([
    ["sources: nope\n", "malformed sources"],
    ['sources:\n  - book: "Other"\n    pages: [1]\n', "unknown source book"],
    ['sources:\n  - book: "GMG"\n    pages: [0]\n', "positive integers"],
    ['sources:\n  - book: "GMG"\n    pages: [1.5]\n', "positive integers"],
  ])("rejects malformed source metadata", (metadata, message) => {
    expect(() => parseRule("bad", rawRule(metadata))).toThrow(message);
  });

  it("rejects missing and nested variant parents", () => {
    const grandparent: Rule = {
      slug: "grandparent",
      title: "Grandparent",
      category: "core-rules",
      content: "",
    };
    const parent: Rule = {
      slug: "parent",
      title: "Parent",
      category: "core-rules",
      content: "",
      variantOf: "grandparent",
    };
    const child: Rule = {
      slug: "child",
      title: "Child",
      category: "core-rules",
      content: "",
      variantOf: "parent",
    };
    expect(() => validateRuleVariants([child])).toThrow(
      "unknown variant parent"
    );
    expect(() => validateRuleVariants([grandparent, parent, child])).toThrow(
      "variant parent must not be a variant"
    );
  });

  it("retrieves children in deterministic title order", () => {
    const rules: Rule[] = [
      {
        slug: "z-child",
        title: "Zulu",
        category: "core-rules",
        content: "",
        variantOf: "parent",
      },
      {
        slug: "a-child",
        title: "Alpha",
        category: "core-rules",
        content: "",
        variantOf: "parent",
      },
    ];
    expect(getRuleVariants("parent", rules).map((rule) => rule.slug)).toEqual([
      "a-child",
      "z-child",
    ]);
  });
});
