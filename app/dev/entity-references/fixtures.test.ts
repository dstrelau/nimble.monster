import { describe, expect, it } from "vitest";
import { ENTITY_TYPE_PATHS, ENTITY_TYPES } from "@/lib/types/entity-links";
import { casesToContent, REJECTED_URL_CASES, referenceCases } from "./fixtures";

describe("entity reference cases", () => {
  it.each(
    ENTITY_TYPES
  )("covers URL, shorthand, labels, and privacy for %s", (type) => {
    const cases = referenceCases({
      key: type,
      label: type,
      type,
      id: "00000000-0000-0000-0000-00000000000b",
      url: `https://nimble.nexus/${ENTITY_TYPE_PATHS[type]}/sample-0000000000000000000000000b`,
      available: true,
      privateId: "00000000-0000-0000-0000-00000000000c",
    });
    const content = casesToContent(cases);
    expect(content).toContain(`@${type}:0000000000000000000000000b`);
    expect(content).toContain(
      `@${type}:[0000000000000000000000000b|custom label]`
    );
    expect(content).toContain(
      `https://nimble.nexus/${ENTITY_TYPE_PATHS[type]}/00000000-0000-0000-0000-00000000000b`
    );
    expect(content).toContain(
      `@${type}:[0000000000000000000000000c|must not display]`
    );
    expect(content).toContain("**List:** \n-");
    expect(content).toContain("[[Dazed|dazed]]");
    expect(content).toContain("2d6-sword-0000000000000000000000000b");
    expect(new Set(cases.map((entry) => entry.label)).size).toBe(cases.length);
  });

  it("preserves rule variant anchors when adding query strings", () => {
    const cases = referenceCases({
      key: "variant",
      label: "Rule variant",
      type: "rule",
      id: "playing-dead",
      url: "https://nimble.nexus/rules/conditions#variant-playing-dead",
      available: true,
    });
    expect(cases.find((entry) => entry.label === "Query string")?.content).toBe(
      "https://nimble.nexus/rules/conditions?from=share#variant-playing-dead"
    );
    expect(casesToContent(cases)).toContain("@rule:playing-dead");
    expect(cases.some((entry) => entry.label === "Legacy UUID URL")).toBe(
      false
    );
  });

  it("includes unsafe origins and nondetail routes without changing the source", () => {
    expect(REJECTED_URL_CASES).toHaveLength(12);
    expect(casesToContent(REJECTED_URL_CASES)).toContain(
      "https://nimble.nexus.evil.com/items/"
    );
    expect(casesToContent(REJECTED_URL_CASES)).toContain(
      "https://nimble.nexus/items/new"
    );
  });
});
