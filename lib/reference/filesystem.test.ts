import { describe, expect, it } from "vitest";
import {
  getAllReferenceFrontmatter,
  getAllReferenceSlugs,
  getAllSections,
  getPageForSection,
  getReferenceFileBySlug,
  getSectionBySlug,
  getSectionsForPage,
} from "./filesystem";

describe("page-level accessors", () => {
  it("returns all 37 page slugs", () => {
    const slugs = getAllReferenceSlugs();
    expect(slugs).toHaveLength(37);
    expect(slugs).toContain("combat-structure");
    expect(slugs).toContain("glossary");
  });

  it("getAllReferenceFrontmatter returns {title,slug,category} per page", () => {
    const fm = getAllReferenceFrontmatter();
    expect(fm).toHaveLength(37);
    const combat = fm.find((e) => e.slug === "combat-structure");
    expect(combat).toEqual({
      slug: "combat-structure",
      title: "Combat Structure",
      category: "combat",
    });
  });

  it("getReferenceFileBySlug composes the page body from its sections in order", () => {
    const page = getReferenceFileBySlug("combat-structure");
    expect(page).not.toBeNull();
    if (!page) return;
    expect(page.category).toBe("combat");
    // Composed body contains every section heading, in order.
    const idxInitiative = page.content.indexOf("### Initiative");
    const idxSurprise = page.content.indexOf("### Surprise");
    const idxActing = page.content.indexOf("### Acting Over Multiple Turns");
    expect(idxInitiative).toBeGreaterThanOrEqual(0);
    expect(idxSurprise).toBeGreaterThan(idxInitiative);
    expect(idxActing).toBeGreaterThan(idxSurprise);
  });

  it("returns null for an unknown page slug", () => {
    expect(getReferenceFileBySlug("does-not-exist")).toBeNull();
  });
});

describe("section-level accessors", () => {
  it("getSectionsForPage returns ordered sections for a page", () => {
    const sections = getSectionsForPage("combat-structure");
    expect(sections.map((s) => s.slug)).toEqual([
      "combat-structure__initiative",
      "combat-structure__surprise",
      "combat-structure__turn-order",
      "combat-structure__turns-rounds-encounters",
      "combat-structure__acting-over-multiple-turns",
    ]);
    expect(sections[0].order).toBe(1);
    expect(sections[0].pageSlug).toBe("combat-structure");
    expect(sections[0].content).toContain("### Initiative");
  });

  it("a headingless page becomes a single section keyed by the page slug", () => {
    const sections = getSectionsForPage("grappling");
    expect(sections).toHaveLength(1);
    expect(sections[0].slug).toBe("grappling");
  });

  it("getSectionBySlug resolves a globally unique section id", () => {
    const section = getSectionBySlug("combat-structure__surprise");
    expect(section?.title).toBe("Surprise");
    expect(section?.pageSlug).toBe("combat-structure");
    expect(getSectionBySlug("nope__nope")).toBeNull();
  });

  it("getPageForSection maps a section back to its page frontmatter", () => {
    const page = getPageForSection("combat-structure__surprise");
    expect(page).toEqual({
      slug: "combat-structure",
      title: "Combat Structure",
      category: "combat",
    });
    expect(getPageForSection("nope__nope")).toBeNull();
  });

  it("all section slugs are globally unique", () => {
    const slugs = getAllSections().map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every manifest section resolves to a file (no dangling refs)", () => {
    for (const page of getAllReferenceFrontmatter()) {
      for (const section of getSectionsForPage(page.slug)) {
        expect(getSectionBySlug(section.slug)).not.toBeNull();
      }
    }
  });
});
