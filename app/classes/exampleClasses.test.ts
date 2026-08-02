import { describe, expect, it } from "vitest";
import { EXAMPLE_CLASSES, exampleClassToFormValues } from "./exampleClasses";

describe("exampleClassToFormValues", () => {
  const berserker = EXAMPLE_CLASSES.Berserker;

  it("copies the example's top-level stats", () => {
    const values = exampleClassToFormValues(berserker);
    expect(values.name).toBe("Berserker");
    expect(values.keyStats).toEqual(["STR", "DEX"]);
    expect(values.hitDie).toBe("d12");
    expect(values.startingHp).toBe(20);
    expect(values.saves).toEqual({ STR: 1, DEX: 0, INT: -1, WIL: 0 });
    expect(values.weapons).toEqual([{ type: "STR" }]);
    expect(values.startingGear).toContain("Battleaxe");
    expect(values.visibility).toBe("public");
  });

  it("expands to all 20 levels with the example's abilities", () => {
    const values = exampleClassToFormValues(berserker);
    expect(values.levels).toHaveLength(20);
    expect(values.levels.map((l) => l.level)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1)
    );
    expect(values.levels[0].abilities.map((a) => a.name)).toEqual([
      "Rage",
      "That all you got?!",
    ]);
  });

  it("keeps one blank ability row for levels the example does not define", () => {
    const values = exampleClassToFormValues({
      ...berserker,
      levels: [{ level: 1, abilities: [{ name: "Rage", description: "..." }] }],
    });
    expect(values.levels[1].abilities).toHaveLength(1);
    expect(values.levels[1].abilities[0]).toMatchObject({
      name: "",
      description: "",
    });
  });

  it("assigns a unique id to every ability", () => {
    const ids = exampleClassToFormValues(berserker).levels.flatMap((l) =>
      l.abilities.map((a) => a.id)
    );
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries over class option lists", () => {
    const values = exampleClassToFormValues(berserker);
    expect(values.abilityLists).toHaveLength(1);
    expect(values.abilityLists[0].name).toBe("Savage Arsenal");
    expect(values.abilityLists[0].items.length).toBeGreaterThan(0);
  });
});
