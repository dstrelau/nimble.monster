import { describe, expect, it } from "vitest";
import { formatHp, monsterLevelValue } from "./monster";

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
