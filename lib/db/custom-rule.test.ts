import { describe, expect, it } from "vitest";
import {
  type CustomRuleSectionLink,
  diffSectionLinks,
  validateSectionLinks,
} from "./custom-rule";

const VALID = ["movement", "monster-armor", "combat-structure__initiative"];

const link = (
  sectionSlug: string,
  relation: CustomRuleSectionLink["relation"]
): CustomRuleSectionLink => ({ sectionSlug, relation });

describe("validateSectionLinks", () => {
  it("returns valid links unchanged", () => {
    expect(
      validateSectionLinks(
        [link("movement", "replaces"), link("monster-armor", "augments")],
        VALID
      )
    ).toEqual([
      link("movement", "replaces"),
      link("monster-armor", "augments"),
    ]);
  });

  it("defaults a missing relation to augments", () => {
    expect(validateSectionLinks([{ sectionSlug: "movement" }], VALID)).toEqual([
      link("movement", "augments"),
    ]);
  });

  it("trims whitespace and drops empty slugs", () => {
    expect(
      validateSectionLinks(
        [
          { sectionSlug: "  movement  ", relation: "replaces" },
          { sectionSlug: "", relation: "augments" },
          { sectionSlug: "   ", relation: "augments" },
        ],
        VALID
      )
    ).toEqual([link("movement", "replaces")]);
  });

  it("dedupes by slug, first occurrence wins", () => {
    expect(
      validateSectionLinks(
        [link("movement", "replaces"), link("movement", "augments")],
        VALID
      )
    ).toEqual([link("movement", "replaces")]);
  });

  it("accepts section slugs of the form page__heading", () => {
    expect(
      validateSectionLinks(
        [link("combat-structure__initiative", "augments")],
        VALID
      )
    ).toEqual([link("combat-structure__initiative", "augments")]);
  });

  it("throws when a slug is not a known reference section", () => {
    expect(() =>
      validateSectionLinks([link("not-a-section", "augments")], VALID)
    ).toThrow(/Unknown reference section/);
  });

  it("returns an empty array for no input", () => {
    expect(validateSectionLinks([], VALID)).toEqual([]);
  });
});

describe("diffSectionLinks", () => {
  it("computes additions and removals by slug", () => {
    expect(
      diffSectionLinks(
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
      diffSectionLinks(
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
      diffSectionLinks(
        [link("movement", "replaces")],
        [link("movement", "replaces")]
      )
    ).toEqual({ toAdd: [], toRemove: [] });
  });

  it("handles going from empty to populated", () => {
    expect(diffSectionLinks([], [link("movement", "replaces")])).toEqual({
      toAdd: [link("movement", "replaces")],
      toRemove: [],
    });
  });

  it("handles clearing all links", () => {
    expect(diffSectionLinks([link("movement", "augments")], [])).toEqual({
      toAdd: [],
      toRemove: [link("movement", "augments")],
    });
  });
});
