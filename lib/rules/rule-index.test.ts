import { describe, expect, it } from "vitest";
import type { Rule } from "./filesystem";
import { groupByCategory, ruleUrl, variantParentUrl } from "./rule-index";

const rule = (title: string, category: string): Rule => ({
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  category,
  content: "",
});

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

describe("groupByCategory", () => {
  it("returns groups in CATEGORIES order and drops empty ones", () => {
    const groups = groupByCategory([
      rule("Mana", "magic"),
      rule("Armor", "combat"),
      rule("Conditions", "core-rules"),
    ]);
    expect(groups.map((g) => g.category.slug)).toEqual([
      "core-rules",
      "combat",
      "magic",
    ]);
  });

  it("ignores rules with an unknown category", () => {
    expect(groupByCategory([rule("Ghost", "nope")])).toEqual([]);
  });

  it("omits variants from category groups", () => {
    const variant = {
      ...rule("Quick Initiative", "combat"),
      variantOf: "initiative",
    };
    const groups = groupByCategory([rule("Initiative", "combat"), variant]);
    expect(groups[0].rules.map((entry) => entry.title)).toEqual(["Initiative"]);
  });
});
