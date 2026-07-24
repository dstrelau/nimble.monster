import { describe, expect, it } from "vitest";
import {
  buildRelatedPairs,
  groupRelatedBySection,
  parseRelationsYaml,
} from "./relations";

describe("parseRelationsYaml", () => {
  it("parses flow-mapping pairs, ignoring comments and blanks", () => {
    const raw = `# a comment
pairs:
  - { from: cover-hiding__cover, to: cover-hiding__hiding }

  - { from: movement, to: range-reach }  # trailing comment
`;
    expect(parseRelationsYaml(raw)).toEqual([
      { from: "cover-hiding__cover", to: "cover-hiding__hiding" },
      { from: "movement", to: "range-reach" },
    ]);
  });

  it("unquotes quoted values", () => {
    expect(parseRelationsYaml(`- { from: "a", to: 'b' }`)).toEqual([
      { from: "a", to: "b" },
    ]);
  });

  it("throws on an unparseable line", () => {
    expect(() => parseRelationsYaml("- from: a to: b")).toThrow(/cannot parse/);
  });
});

describe("buildRelatedPairs", () => {
  const valid = ["a", "b", "c", "d"];

  it("canonicalizes endpoint order (from < to)", () => {
    expect(buildRelatedPairs([{ from: "c", to: "a" }], valid)).toEqual([
      { from: "a", to: "c" },
    ]);
  });

  it("dedupes symmetric duplicates regardless of direction", () => {
    expect(
      buildRelatedPairs(
        [
          { from: "a", to: "b" },
          { from: "b", to: "a" },
          { from: "a", to: "b" },
        ],
        valid
      )
    ).toEqual([{ from: "a", to: "b" }]);
  });

  it("drops self-pairs", () => {
    expect(buildRelatedPairs([{ from: "a", to: "a" }], valid)).toEqual([]);
  });

  it("throws listing every unknown slug", () => {
    expect(() =>
      buildRelatedPairs(
        [
          { from: "a", to: "zzz" },
          { from: "yyy", to: "b" },
        ],
        valid
      )
    ).toThrow(/unknown section slug\(s\): yyy, zzz/);
  });
});

describe("groupRelatedBySection", () => {
  it("recovers symmetry from single-row edges", () => {
    const edges = [{ from: "cover", to: "hiding" }];
    const map = groupRelatedBySection(edges, ["cover", "hiding"]);
    expect(map.get("cover")).toEqual(["hiding"]);
    expect(map.get("hiding")).toEqual(["cover"]);
  });

  it("matches an edge whose only on-page endpoint is `to`", () => {
    const edges = [{ from: "grappling", to: "conditions__prone" }];
    const map = groupRelatedBySection(edges, ["conditions__prone"]);
    expect(map.get("conditions__prone")).toEqual(["grappling"]);
    expect(map.has("grappling")).toBe(false);
  });

  it("dedupes and sorts a section's targets", () => {
    const edges = [
      { from: "m", to: "range" },
      { from: "measuring", to: "m" },
      { from: "m", to: "range" },
    ];
    const map = groupRelatedBySection(edges, ["m"]);
    expect(map.get("m")).toEqual(["measuring", "range"]);
  });

  it("returns an empty map when no edge touches the page", () => {
    const map = groupRelatedBySection([{ from: "x", to: "y" }], ["z"]);
    expect(map.size).toBe(0);
  });
});
