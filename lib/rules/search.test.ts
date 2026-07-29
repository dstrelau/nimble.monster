import { describe, expect, it } from "vitest";
import type { Rule } from "./filesystem";
import {
  buildExcerpt,
  scoreRule,
  searchRuleSet,
  tokenize,
  toPlainText,
} from "./search";

const rule = (title: string, content = ""): Rule => ({
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  category: "core-rules",
  content,
});

describe("tokenize", () => {
  it("lowercases and drops empty tokens", () => {
    expect(tokenize("  Hit   Points ")).toEqual(["hit", "points"]);
  });
});

describe("toPlainText", () => {
  it("unwraps crosslink placeholders to their visible text", () => {
    expect(toPlainText("You are {{term:Bloodied}} now")).toBe(
      "You are Bloodied now"
    );
  });

  it("strips markdown syntax and link targets", () => {
    expect(toPlainText("### Wounds\n\n**Bad** [stuff](/rules/x)")).toBe(
      "Wounds Bad stuff"
    );
  });
});

describe("scoreRule", () => {
  it("ranks an exact title match above a body-only match", () => {
    const exact = scoreRule(rule("Wounds"), "", ["wounds"]);
    const body = scoreRule(rule("Death", "wounds hurt"), "wounds hurt", [
      "wounds",
    ]);
    expect(exact).toBeGreaterThan(body);
  });

  it("requires every token to appear somewhere", () => {
    const r = rule("Wounds", "wounds hurt");
    expect(scoreRule(r, "wounds hurt", ["wounds", "banana"])).toBe(0);
  });
});

describe("buildExcerpt", () => {
  it("wraps matches in <mark>, case-insensitively", () => {
    expect(buildExcerpt("Wounds are serious", ["wounds"])).toBe(
      "<mark>Wounds</mark> are serious"
    );
  });

  it("escapes HTML so only <mark> survives", () => {
    const out = buildExcerpt('<img src=x onerror="alert(1)"> wounds', [
      "wounds",
    ]);
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
    expect(out).toContain("<mark>wounds</mark>");
  });

  it("windows long text around the first match", () => {
    const plain = `${"a ".repeat(300)}needle${" b".repeat(300)}`;
    const out = buildExcerpt(plain, ["needle"]);
    expect(out).toContain("<mark>needle</mark>");
    expect(out.startsWith("…")).toBe(true);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThan(300);
  });

  it("does not treat regex metacharacters in a token as a pattern", () => {
    expect(() => buildExcerpt("a+b", ["a+b"])).not.toThrow();
    expect(buildExcerpt("a+b", ["a+b"])).toBe("<mark>a+b</mark>");
  });
});

describe("searchRuleSet", () => {
  it("returns variants under their individual slugs and labels them", () => {
    const variant = {
      ...rule("Quick Initiative", "Act before enemies."),
      variantOf: "initiative",
    };
    expect(searchRuleSet([variant], "quick initiative")).toEqual([
      expect.objectContaining({
        slug: "quick-initiative",
        variantOf: "initiative",
      }),
    ]);
  });

  it("links a combined skill directly to its heading", () => {
    expect(
      searchRuleSet(
        [rule("Skills", "## Finesse (DEX)\n\nCareful movement")],
        "Finesse"
      )[0]
    ).toMatchObject({
      slug: "skills",
      title: "Finesse (DEX)",
      anchor: "finesse-dex",
    });
  });

  it("links a combined condition directly to its heading", () => {
    expect(
      searchRuleSet(
        [rule("Conditions", "## Poisoned\n\nDisadvantage on rolls")],
        "Poisoned"
      )[0]
    ).toMatchObject({
      slug: "conditions",
      title: "Poisoned",
      anchor: "poisoned",
    });
  });

  it("preserves variant metadata for section results", () => {
    const variant = {
      ...rule("Movement Variant", "## Gridless\n\nUse abstract distances."),
      variantOf: "movement",
    };
    expect(searchRuleSet([variant], "gridless")[0]).toMatchObject({
      slug: "movement-variant",
      variantOf: "movement",
      anchor: "gridless",
    });
  });
});
