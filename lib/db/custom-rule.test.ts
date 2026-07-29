import { describe, expect, it } from "vitest";
import {
  type CustomRuleLink,
  diffRuleLinks,
  groupCustomRuleReverseLinks,
  validateRuleLinks,
} from "./custom-rule";

const VALID = ["movement", "monster-armor", "combat-structure__initiative"];

const link = (
  ruleSlug: string,
  relation: CustomRuleLink["relation"]
): CustomRuleLink => ({ ruleSlug, relation });

describe("validateRuleLinks", () => {
  it("returns valid links unchanged", () => {
    expect(
      validateRuleLinks(
        [link("movement", "replaces"), link("monster-armor", "augments")],
        VALID
      )
    ).toEqual([
      link("movement", "replaces"),
      link("monster-armor", "augments"),
    ]);
  });

  it("defaults a missing relation to augments", () => {
    expect(validateRuleLinks([{ ruleSlug: "movement" }], VALID)).toEqual([
      link("movement", "augments"),
    ]);
  });

  it("trims whitespace and drops empty slugs", () => {
    expect(
      validateRuleLinks(
        [
          { ruleSlug: "  movement  ", relation: "replaces" },
          { ruleSlug: "", relation: "augments" },
          { ruleSlug: "   ", relation: "augments" },
        ],
        VALID
      )
    ).toEqual([link("movement", "replaces")]);
  });

  it("dedupes by slug, first occurrence wins", () => {
    expect(
      validateRuleLinks(
        [link("movement", "replaces"), link("movement", "augments")],
        VALID
      )
    ).toEqual([link("movement", "replaces")]);
  });

  it("accepts section slugs of the form page__heading", () => {
    expect(
      validateRuleLinks(
        [link("combat-structure__initiative", "augments")],
        VALID
      )
    ).toEqual([link("combat-structure__initiative", "augments")]);
  });

  it("throws when a slug is not a known reference section", () => {
    expect(() =>
      validateRuleLinks([link("not-a-section", "augments")], VALID)
    ).toThrow(/Unknown rule/);
  });

  it("returns an empty array for no input", () => {
    expect(validateRuleLinks([], VALID)).toEqual([]);
  });
});

describe("diffRuleLinks", () => {
  it("computes additions and removals by slug", () => {
    expect(
      diffRuleLinks(
        [link("movement", "replaces"), link("monster-armor", "augments")],
        [
          link("movement", "replaces"),
          link("combat-structure__initiative", "augments"),
        ]
      )
    ).toEqual({
      toAdd: [link("combat-structure__initiative", "augments")],
      toRemove: [link("monster-armor", "augments")],
    });
  });

  it("treats a relation change as remove + add of the same slug", () => {
    expect(
      diffRuleLinks(
        [link("movement", "augments")],
        [link("movement", "replaces")]
      )
    ).toEqual({
      toAdd: [link("movement", "replaces")],
      toRemove: [link("movement", "augments")],
    });
  });

  it("is a no-op when unchanged", () => {
    expect(
      diffRuleLinks(
        [link("movement", "replaces")],
        [link("movement", "replaces")]
      )
    ).toEqual({ toAdd: [], toRemove: [] });
  });

  it("handles going from empty to populated", () => {
    expect(diffRuleLinks([], [link("movement", "replaces")])).toEqual({
      toAdd: [link("movement", "replaces")],
      toRemove: [],
    });
  });

  it("handles clearing all links", () => {
    expect(diffRuleLinks([link("movement", "augments")], [])).toEqual({
      toAdd: [],
      toRemove: [link("movement", "augments")],
    });
  });
});

describe("groupCustomRuleReverseLinks", () => {
  const ID_A = "11111111-1111-1111-1111-111111111111";
  const ID_B = "22222222-2222-2222-2222-222222222222";

  it("splits rows by relation with resolved urls", () => {
    const result = groupCustomRuleReverseLinks([
      { id: ID_A, name: "Gritty Wounds", relation: "replaces" },
      { id: ID_B, name: "Slow Healing", relation: "augments" },
    ]);
    expect(result.replaces).toEqual([
      {
        id: ID_A,
        name: "Gritty Wounds",
        url: expect.stringContaining("/custom-rules/gritty-wounds-"),
      },
    ]);
    expect(result.augments).toEqual([
      {
        id: ID_B,
        name: "Slow Healing",
        url: expect.stringContaining("/custom-rules/slow-healing-"),
      },
    ]);
  });

  it("dedupes a rule that links several sections under one relation", () => {
    const result = groupCustomRuleReverseLinks([
      { id: ID_A, name: "Gritty Wounds", relation: "replaces" },
      { id: ID_A, name: "Gritty Wounds", relation: "replaces" },
    ]);
    expect(result.replaces).toHaveLength(1);
  });

  it("returns empty groups for no rows", () => {
    expect(groupCustomRuleReverseLinks([])).toEqual({
      replaces: [],
      augments: [],
    });
  });
});
