import { describe, expect, it } from "vitest";
import {
  getAllRuleFaqs,
  getRuleFaqs,
  parseRuleFaq,
  ruleFaqUrl,
  splitRuleContent,
} from "./faqs";

const rawFaq = (metadata: string): string => `---
question: "Can I do this?"
kind: common
targets: [conditions#prone]
keywords: ["example question"]
${metadata || 'sources:\n  - book: "Core Rules v2"\n    pages: [1]\n'}---

Yes, when the rule allows it.
`;

describe("FAQ parsing", () => {
  it("parses a common question with a section target", () => {
    expect(parseRuleFaq("example", rawFaq(""))).toMatchObject({
      slug: "example",
      question: "Can I do this?",
      kind: "common",
      targets: [{ ruleSlug: "conditions", anchor: "prone" }],
    });
  });

  it("requires provenance for official and common questions", () => {
    expect(() =>
      parseRuleFaq(
        "official",
        rawFaq("note: test\n").replace("kind: common", "kind: official")
      )
    ).toThrow("missing sources");
  });

  it("splits combined rules into addressable sections", () => {
    expect(
      splitRuleContent(
        "An introduction.\n\n## First Part\n\nOne.\n\n## Second\n\nTwo."
      )
    ).toEqual([
      { content: "An introduction." },
      { content: "## First Part\n\nOne.", anchor: "first-part" },
      { content: "## Second\n\nTwo.", anchor: "second" },
    ]);
  });
});

describe("the FAQ corpus", () => {
  it("stores each Core Rules FAQ as an official sourced question", () => {
    const faqs = getAllRuleFaqs();
    expect(faqs).toHaveLength(18);
    const published = faqs.filter((faq) =>
      faq.sources.some(
        (source) =>
          source.book === "Core Rules v2" && source.pages?.includes(55)
      )
    );
    expect(published).toHaveLength(9);
    for (const faq of published) {
      expect(faq.kind).toBe("official");
      expect(faq.sources).toEqual([{ book: "Core Rules v2", pages: [55] }]);
    }
    expect(faqs.map((faq) => faq.slug)).toEqual(
      expect.arrayContaining([
        "interpose-and-defend",
        "assess-skill",
        "dual-wielding-different-weapons",
        "half-elves",
        "negative-strength-field-rest",
        "safe-rest-duration",
        "playing-virtually",
        "legendary-monster-turns",
        "wealthy-noble",
      ])
    );
  });

  it("relates questions directly to rules and section anchors", () => {
    expect(getRuleFaqs("defend").map(({ faq }) => faq.slug)).toEqual(
      expect.arrayContaining([
        "barrier-of-wind",
        "defensive-reaction-spells",
        "warding-bond",
      ])
    );
    expect(
      getRuleFaqs("stats").find(({ faq }) => faq.slug === "key")?.target
    ).toEqual({ ruleSlug: "stats", anchor: "key" });
  });

  it("builds a stable canonical link to the FAQ callout", () => {
    const faq = getAllRuleFaqs().find(({ slug }) => slug === "warding-bond");
    expect(faq && ruleFaqUrl(faq)).toBe("/rules/defend#faq-warding-bond");
  });
});
