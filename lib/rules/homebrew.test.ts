import { describe, expect, it } from "vitest";
import { getRule } from "./filesystem";
import { groupHomebrewByCategory } from "./homebrew";

const brew = (id: string, ...ruleSlugs: string[]) => ({
  id,
  links: ruleSlugs.map((ruleSlug) => ({ ruleSlug })),
});

describe("groupHomebrewByCategory", () => {
  it("files a rule under the category of the rule it links", () => {
    const grouped = groupHomebrewByCategory([brew("a", "initiative")]);
    expect(grouped.get(getRule("initiative")?.category ?? "")).toEqual([
      brew("a", "initiative"),
    ]);
  });

  it("lists a rule under every category it touches", () => {
    const grouped = groupHomebrewByCategory([brew("a", "initiative", "mana")]);
    const categories = [...grouped.keys()].sort();
    expect(categories).toEqual(["combat", "magic"]);
    for (const category of categories) {
      expect(grouped.get(category)).toHaveLength(1);
    }
  });

  it("lists a rule once per category even with several links there", () => {
    const grouped = groupHomebrewByCategory([brew("a", "mana", "upcasting")]);
    expect(grouped.get("magic")).toHaveLength(1);
  });

  it("drops links to unknown rules, and rules left with no links", () => {
    expect(groupHomebrewByCategory([brew("a", "ghost"), brew("b")]).size).toBe(
      0
    );
  });
});
