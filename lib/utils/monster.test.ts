import { describe, expect, it } from "vitest";
import {
  encounterMonsterLevelTotal,
  formatHp,
  hasLegendaryEncounterConflict,
  legendaryEncounterDifficulty,
  monsterLevelValue,
  resolvedEncounterMonsterCount,
} from "./monster";

describe("formatHp", () => {
  it("returns the fixed hp as a string when hpPerHero is null", () => {
    expect(formatHp({ hp: 130, hpPerHero: null })).toBe("130");
  });

  it("returns the fixed hp as a string when hpPerHero is undefined", () => {
    expect(formatHp({ hp: 30, hpPerHero: undefined })).toBe("30");
  });

  it("formats as X/hero when hpPerHero is set", () => {
    expect(formatHp({ hp: 0, hpPerHero: 48 })).toBe("48/hero");
  });

  it("prefers hpPerHero over the fixed hp when both are present", () => {
    expect(formatHp({ hp: 320, hpPerHero: 64 })).toBe("64/hero");
  });

  it("treats hpPerHero of 0 as a per-hero value", () => {
    expect(formatHp({ hp: 100, hpPerHero: 0 })).toBe("0/hero");
  });
});

describe("monsterLevelValue", () => {
  it("returns positive levelInt values as-is", () => {
    expect(monsterLevelValue(5)).toBe(5);
  });

  it("returns 0 for level '-'", () => {
    expect(monsterLevelValue(0)).toBe(0);
  });

  it("converts -4 to 1/4", () => {
    expect(monsterLevelValue(-4)).toBeCloseTo(0.25);
  });

  it("converts -3 to 1/3", () => {
    expect(monsterLevelValue(-3)).toBeCloseTo(1 / 3);
  });

  it("converts -2 to 1/2", () => {
    expect(monsterLevelValue(-2)).toBeCloseTo(0.5);
  });
});

describe("resolvedEncounterMonsterCount", () => {
  it("resolves a static count", () => {
    expect(
      resolvedEncounterMonsterCount(
        { quantity: 2, isPerHero: false, heroesPerMonster: 4 },
        6
      )
    ).toBe(2);
  });

  it("resolves a per-hero ratio below one", () => {
    expect(
      resolvedEncounterMonsterCount(
        { quantity: 1, isPerHero: true, heroesPerMonster: 4 },
        6
      )
    ).toBe(1.5);
  });

  it("treats a legendary monster as a static solo", () => {
    expect(
      resolvedEncounterMonsterCount(
        {
          monster: { legendary: true },
          quantity: 3,
          isPerHero: true,
          heroesPerMonster: 1,
        },
        6
      )
    ).toBe(1);
  });
});

describe("encounterMonsterLevelTotal", () => {
  it("counts a legendary monster's level once per hero", () => {
    expect(
      encounterMonsterLevelTotal({ legendary: true, levelInt: 5 }, 1, 4)
    ).toBe(20);
  });

  it("counts a standard monster's level once per monster", () => {
    expect(
      encounterMonsterLevelTotal({ legendary: false, levelInt: 5 }, 2, 4)
    ).toBe(10);
  });
});

describe("legendaryEncounterDifficulty", () => {
  it.each([
    [8, 10, "Easy"],
    [9, 10, "Medium"],
    [10, 10, "Hard"],
    [11, 10, "Deadly"],
    [12, 10, "Very Deadly"],
  ] as const)("reports a level %i legendary encounter against level %i heroes as %s", (encounterLevel, heroLevel, expected) => {
    expect(legendaryEncounterDifficulty(encounterLevel, heroLevel)).toBe(
      expected
    );
  });
});

describe("hasLegendaryEncounterConflict", () => {
  it("allows a legendary monster to run alone", () => {
    expect(
      hasLegendaryEncounterConflict([
        { monster: { legendary: true, minion: false } },
      ])
    ).toBe(false);
  });

  it("allows a legendary monster with minions", () => {
    expect(
      hasLegendaryEncounterConflict([
        { monster: { legendary: true, minion: false } },
        { monster: { legendary: false, minion: true } },
      ])
    ).toBe(false);
  });

  it("warns when a legendary monster has non-minion support", () => {
    expect(
      hasLegendaryEncounterConflict([
        { monster: { legendary: true, minion: false } },
        { monster: { legendary: false, minion: false } },
      ])
    ).toBe(true);
  });
});
