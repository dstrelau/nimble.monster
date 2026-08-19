import { describe, expect, it } from "vitest";
import { FORMATTING_FIXTURES } from "./fixtures";

describe("text-formatting fixtures", () => {
  it("has unique, labeled fixtures for every supported stress category", () => {
    const ids = FORMATTING_FIXTURES.map((fixture) => fixture.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "paragraphs",
      "soft-newlines",
      "emphasis",
      "dice",
      "conditions",
      "lists",
      "headings",
      "combined",
      "malformed",
      "long-content",
    ]);
  });

  it("includes the interactive syntax used by production content", () => {
    const content = FORMATTING_FIXTURES.map((fixture) => fixture.content).join(
      "\n"
    );

    expect(content).toContain("**bold text**");
    expect(content).toContain("2d6+4");
    expect(content).toContain("[[Dazed]]");
    expect(content).toContain("- Resolve the attack");
    expect(content).toContain("# Primary heading");
  });
});
