import { describe, expect, it } from "vitest";
import {
  levelIntToDisplay,
  monstersSortedByLevelInt,
  stringToLevelInt,
} from "./utils";

describe("levelIntToDisplay", () => {
  it("converts special values to fractions", () => {
    expect(levelIntToDisplay(-4)).toBe("1/4");
    expect(levelIntToDisplay(-3)).toBe("1/3");
    expect(levelIntToDisplay(-2)).toBe("1/2");
  });

  it("converts regular levels to strings", () => {
    expect(levelIntToDisplay(1)).toBe("1");
    expect(levelIntToDisplay(5)).toBe("5");
    expect(levelIntToDisplay(20)).toBe("20");
  });

  it("handles fallback cases", () => {
    expect(levelIntToDisplay(0)).toBe("");
    expect(levelIntToDisplay(-1)).toBe("");
    expect(levelIntToDisplay(-5)).toBe("");
  });
});

describe("stringToLevelInt", () => {
  it("converts fractions to special values", () => {
    expect(stringToLevelInt("1/4")).toBe(-4);
    expect(stringToLevelInt("1/3")).toBe(-3);
    expect(stringToLevelInt("1/2")).toBe(-2);
  });

  it("converts regular level strings to integers", () => {
    expect(stringToLevelInt("1")).toBe(1);
    expect(stringToLevelInt("5")).toBe(5);
    expect(stringToLevelInt("20")).toBe(20);
  });

  it("handles invalid levels", () => {
    expect(stringToLevelInt("invalid")).toBe(0);
    expect(stringToLevelInt("21")).toBe(0); // out of range
    expect(stringToLevelInt("0")).toBe(0);
    expect(stringToLevelInt("-1")).toBe(0);
  });
});

describe("monstersSortedByLevelInt", () => {
  const mockMonsters = [
    { id: "1", name: "Dragon", levelInt: 20 },
    { id: "2", name: "Goblin", levelInt: -4 }, // 1/4
    { id: "3", name: "Orc", levelInt: 1 },
    { id: "4", name: "Wolf", levelInt: -2 }, // 1/2
    { id: "5", name: "Troll", levelInt: 5 },
    { id: "6", name: "Imp", levelInt: -3 }, // 1/3
  ];

  it("sorts monsters by levelInt ascending", () => {
    const sorted = monstersSortedByLevelInt(mockMonsters);

    expect(sorted.map((m) => m.name)).toEqual([
      "Goblin", // -4 (1/4)
      "Imp", // -3 (1/3)
      "Wolf", // -2 (1/2)
      "Orc", // 1
      "Troll", // 5
      "Dragon", // 20
    ]);
  });

  it("does not mutate the original array", () => {
    const original = [...mockMonsters];
    const sorted = monstersSortedByLevelInt(mockMonsters);

    expect(mockMonsters).toEqual(original);
    expect(sorted).not.toBe(mockMonsters);
  });

  it("handles empty array", () => {
    expect(monstersSortedByLevelInt([])).toEqual([]);
  });

  it("handles single monster", () => {
    const single = [{ id: "1", name: "Solo", levelInt: 5 }];
    expect(monstersSortedByLevelInt(single)).toEqual(single);
    expect(monstersSortedByLevelInt(single)).not.toBe(single);
  });

  it("handles same levelInt monsters", () => {
    const sameLevels = [
      { id: "1", name: "A", levelInt: 1 },
      { id: "2", name: "B", levelInt: 1 },
      { id: "3", name: "C", levelInt: 1 },
    ];
    const sorted = monstersSortedByLevelInt(sameLevels);

    expect(sorted).toHaveLength(3);
    sorted.forEach((monster) => {
      expect(monster.levelInt).toBe(1);
    });
  });
});
