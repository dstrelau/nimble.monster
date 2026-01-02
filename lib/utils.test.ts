import { describe, expect, it } from "vitest";
import { curry, levelIntToDisplay, monstersSortedByLevelInt } from "./utils";

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

describe("curry", () => {
  it("returns result when all args provided", () => {
    const add = (a: number, b: number, c: number) => a + b + c;
    const curriedAdd = curry(add);
    expect(curriedAdd(1, 2, 3)).toBe(6);
  });

  it("supports partial application", () => {
    const add = (a: number, b: number, c: number) => a + b + c;
    const curriedAdd = curry(add);
    const addOne = curriedAdd(1);
    const addOneTwo = addOne(2);
    expect(addOneTwo(3)).toBe(6);
  });

  it("supports multiple args at once", () => {
    const add = (a: number, b: number, c: number) => a + b + c;
    const curriedAdd = curry(add);
    const addOneTwo = curriedAdd(1, 2);
    expect(addOneTwo(3)).toBe(6);
  });

  it("works with different types", () => {
    const concat = (a: string, b: number, c: boolean) => `${a}-${b}-${c}`;
    const curriedConcat = curry(concat);
    const result = curriedConcat("test")(42)(true);
    expect(result).toBe("test-42-true");
  });
});
