import { describe, expect, it } from "vitest";
import type { Rule } from "./filesystem";
import { scoreKeywordMatch, tokenizeForSearch } from "./keyword-search";
import { searchRuleSet } from "./search";

const rule = (title: string, keywords: string[] = []): Rule => ({
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  category: "core-rules",
  content: "body text must never be searched",
  keywords,
});

describe("keyword search", () => {
  it("normalizes query words", () => {
    expect(tokenizeForSearch("  Hit   POINTS ")).toEqual(["hit", "points"]);
  });

  it("requires each query word to prefix-match a title or keyword word", () => {
    expect(scoreKeywordMatch("Death", ["saving throws"], "sav thr")).toBe(1);
    expect(scoreKeywordMatch("Death", ["saving throws"], "avi throw")).toBe(0);
  });

  it("uses the specified ranking tiers", () => {
    expect(scoreKeywordMatch("Saving Throws", [], "saving throws")).toBe(100);
    expect(scoreKeywordMatch("Saving Throws", [], "saving")).toBe(50);
    expect(scoreKeywordMatch("Death", ["saving throws"], "saving throws")).toBe(
      25
    );
    expect(scoreKeywordMatch("Death", ["saving throws"], "saving")).toBe(10);
  });

  it("searches title and keywords but never content", () => {
    expect(searchRuleSet([rule("Death", ["wounds"])], "wounds")).toHaveLength(
      1
    );
    expect(searchRuleSet([rule("Death")], "body")).toEqual([]);
  });
});
