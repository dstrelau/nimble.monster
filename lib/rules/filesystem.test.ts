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
keywords: ["testing"]
${metadata || 'sources:\n  - book: "Core Rules v2"\n    pages: [1]\n'}---
Rule content.
`;

describe("the rule corpus", () => {
  const rules = getAllRules();

  it("loads every rule with a title and a known category", () => {
    expect(rules).toHaveLength(129);
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

  it("requires unique keywords and printed sources on every rule", () => {
    for (const rule of rules) {
      expect(rule.keywords.length).toBeGreaterThan(0);
      expect(
        new Set(rule.keywords.map((keyword) => keyword.trim().toLowerCase()))
          .size
      ).toBe(rule.keywords.length);
      expect(rule.sources?.length).toBeGreaterThan(0);
      for (const source of rule.sources ?? []) {
        expect(["Core Rules v2", "GMG v1"]).toContain(source.book);
        expect(source.pages?.length).toBeGreaterThan(0);
      }
    }
  });

  it("resolves a rule by its flat slug", () => {
    expect(getRule("conditions")?.slug).toBe("conditions");
    expect(getRule("nope")).toBeNull();
  });

  it("consolidates conditions under reference", () => {
    const conditions = getRule("conditions");
    expect(conditions?.category).toBe("lookup");
    expect(conditions?.content).toContain("## Blind");
    expect(conditions?.content).toContain("## Wounded");
    expect(getRule("blinded")).toBeNull();
    expect(getRule("wounded")).toBeNull();
  });

  it("keeps consolidated stats and skills in fundamentals", () => {
    expect(getRule("stats")?.category).toBe("fundamentals");
    expect(getRule("skills")?.category).toBe("fundamentals");
    expect(getRule("skill-checks")?.category).toBe("fundamentals");
    expect(getRule("stats")?.content).toContain("## Strength (STR)");
    expect(getRule("skills")?.content).toContain("## Finesse (DEX)");
  });

  it("separates GM guidance from shared rules", () => {
    expect(getRule("encounter-difficulties")?.category).toBe("encounters");
    expect(getRule("monster-builder")?.category).toBe("monsters");
    expect(getRule("how-much-gold")?.category).toBe("campaigns-rewards");
    expect(getRule("5e-spells")?.category).toBe("5e-conversion");
  });

  it("groups character creation with player equipment", () => {
    const characterRules = rules.filter(
      (rule) => rule.category === "characters-equipment"
    );
    expect(characterRules.map((rule) => rule.slug)).toContain(
      "choose-your-class-ancestry-background"
    );
    expect(characterRules.map((rule) => rule.slug)).toContain(
      "weapon-properties"
    );
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
  - book: "Core Rules v2"
    pages: [14, 56]
  - book: "GMG v1"
    pages: [7]
variantOf: parent-rule
`)
    );
    expect(rule.sources).toEqual([
      { book: "Core Rules v2", pages: [14, 56] },
      { book: "GMG v1", pages: [7] },
    ]);
    expect(rule.variantOf).toBe("parent-rule");
  });

  it("keeps a known source book when its exact page is unknown", () => {
    const rule = parseRule(
      "test-rule",
      rawRule(`sources:\n  - book: "GMG v1"\n`)
    );
    expect(rule.sources).toEqual([{ book: "GMG v1" }]);
  });

  it("requires source metadata", () => {
    expect(() =>
      parseRule(
        "test-rule",
        `---\ntitle: "Test Rule"\nkeywords: ["testing"]\n---\nRule content.\n`
      )
    ).toThrow("missing sources");
  });

  it.each([
    ["sources: nope\n", "malformed sources"],
    ['sources:\n  - book: "Other"\n    pages: [1]\n', "unknown source book"],
    ['sources:\n  - book: "GMG v1"\n    pages: [0]\n', "positive integers"],
    ['sources:\n  - book: "GMG v1"\n    pages: [1.5]\n', "positive integers"],
  ])("rejects malformed source metadata", (metadata, message) => {
    expect(() => parseRule("bad", rawRule(metadata))).toThrow(message);
  });

  it("rejects missing and nested variant parents", () => {
    const grandparent: Rule = {
      slug: "grandparent",
      title: "Grandparent",
      category: "core-rules",
      content: "",
      keywords: ["grandparent"],
    };
    const parent: Rule = {
      slug: "parent",
      title: "Parent",
      category: "core-rules",
      content: "",
      keywords: ["parent"],
      variantOf: "grandparent",
    };
    const child: Rule = {
      slug: "child",
      title: "Child",
      category: "core-rules",
      content: "",
      keywords: ["child"],
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
        keywords: ["zulu"],
        variantOf: "parent",
      },
      {
        slug: "a-child",
        title: "Alpha",
        category: "core-rules",
        content: "",
        keywords: ["alpha"],
        variantOf: "parent",
      },
    ];
    expect(getRuleVariants("parent", rules).map((rule) => rule.slug)).toEqual([
      "a-child",
      "z-child",
    ]);
  });
});
