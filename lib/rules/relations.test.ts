import { describe, expect, it } from "vitest";
import { getAllRules, getValidRuleSlugs } from "./filesystem";
import {
  buildRelatedIndex,
  getRelatedSlugs,
  parseRelationGroups,
} from "./relations";

describe("parseRelationGroups", () => {
  it("reads inline groups and ignores comments", () => {
    expect(
      parseRelationGroups(
        "# a comment\ngroups:\n  - [cover, hiding]\n  - [movement, range-reach, size]\n"
      )
    ).toEqual([
      ["cover", "hiding"],
      ["movement", "range-reach", "size"],
    ]);
  });

  it("expands a hub into one pair per member", () => {
    expect(
      parseRelationGroups("hubs:\n  stats: [skills, initiative]\n")
    ).toEqual([
      ["stats", "skills"],
      ["stats", "initiative"],
    ]);
  });

  it("joins a flow array that wraps across lines", () => {
    expect(
      parseRelationGroups(
        "hubs:\n  conditions:\n    [\n      blinded, prone,\n      slowed,\n    ]\n"
      )
    ).toEqual([
      ["conditions", "blinded"],
      ["conditions", "prone"],
      ["conditions", "slowed"],
    ]);
  });

  it("keeps groups and hubs in the same file separate", () => {
    expect(
      parseRelationGroups("groups:\n  - [a, b]\n\nhubs:\n  h: [c]\n")
    ).toEqual([
      ["a", "b"],
      ["h", "c"],
    ]);
  });
});

describe("buildRelatedIndex", () => {
  const valid = new Set(["a", "b", "c"]);

  it("links every group member to every other, both directions", () => {
    const index = buildRelatedIndex([["a", "b", "c"]], valid);
    expect(index.get("a")).toEqual(["b", "c"]);
    expect(index.get("b")).toEqual(["a", "c"]);
    expect(index.get("c")).toEqual(["a", "b"]);
  });

  it("merges overlapping groups without duplicating", () => {
    const index = buildRelatedIndex(
      [
        ["a", "b"],
        ["a", "b"],
        ["a", "c"],
      ],
      valid
    );
    expect(index.get("a")).toEqual(["b", "c"]);
  });

  it("never links a rule to itself", () => {
    expect(buildRelatedIndex([["a", "a", "b"]], valid).get("a")).toEqual(["b"]);
  });

  it("throws on a slug that is not a real rule", () => {
    expect(() => buildRelatedIndex([["a", "ghost"]], valid)).toThrow(
      /unknown rule "ghost"/
    );
  });
});

describe("the curated graph", () => {
  it("only references real rules and is symmetric", () => {
    const valid = getValidRuleSlugs();
    for (const rule of getAllRules()) {
      for (const other of getRelatedSlugs(rule.slug)) {
        expect(valid.has(other)).toBe(true);
        expect(getRelatedSlugs(other)).toContain(rule.slug);
      }
    }
  });

  it("connects the damage-and-recovery cluster", () => {
    expect(getRelatedSlugs("wounds")).toEqual(
      expect.arrayContaining(["conditions", "death"])
    );
    expect(getRelatedSlugs("hit-dice")).toEqual(
      expect.arrayContaining(["field-rests", "safe-rests"])
    );
  });

  it("links the combined conditions rule to related mechanics", () => {
    expect(getRelatedSlugs("conditions")).toEqual(
      expect.arrayContaining([
        "hit-points-dying-wounds",
        "wounds",
        "death",
        "grappling",
        "concentration",
      ])
    );
  });
});
