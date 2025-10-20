import { describe, expect, it } from "vitest";
import { calculateProbabilityDistribution, parseDiceNotation } from "./dice";

describe("parseDiceNotation", () => {
  it("parses basic dice notation", () => {
    const result = parseDiceNotation("1d8");
    expect(result).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: false,
    });
  });

  it("parses dice with positive modifier", () => {
    const result = parseDiceNotation("3d6+2");
    expect(result).toEqual({
      numDice: 3,
      dieSize: 6,
      modifier: 2,
      vicious: false,
    });
  });

  it("parses dice with negative modifier", () => {
    const result = parseDiceNotation("2d4-1");
    expect(result).toEqual({
      numDice: 2,
      dieSize: 4,
      modifier: -1,
      vicious: false,
    });
  });

  it("parses vicious dice without modifier", () => {
    const result = parseDiceNotation("1d8v");
    expect(result).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: true,
    });
  });

  it("parses vicious dice with modifier", () => {
    const result = parseDiceNotation("3d6v+2");
    expect(result).toEqual({
      numDice: 3,
      dieSize: 6,
      modifier: 2,
      vicious: true,
    });
  });

  it("handles invalid notation", () => {
    expect(parseDiceNotation("invalid")).toBeNull();
    expect(parseDiceNotation("d6")).toBeNull();
    expect(parseDiceNotation("1d")).toBeNull();
    expect(parseDiceNotation("0d6")).toBeNull();
    expect(parseDiceNotation("1d0")).toBeNull();
  });

  it("handles uppercase V", () => {
    const result = parseDiceNotation("1d8V");
    expect(result).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: true,
    });
  });
});

describe("calculateProbabilityDistribution", () => {
  it("calculates distribution for 1d6", () => {
    const diceRoll = parseDiceNotation("1d6");
    if (!diceRoll) throw new Error("Failed to parse dice notation");
    const dist = calculateProbabilityDistribution(diceRoll);

    expect(dist.get(0)).toBe(1 / 6);
    expect(dist.get(1)).toBe(undefined);
    expect(dist.get(2)).toBe(1 / 6);
    expect(dist.get(5)).toBe(1 / 6);
    expect(dist.get(6)).toBe(undefined);
    expect(dist.get(7)).toBe((1 / 6) ** 2); // 6,1
    expect(dist.get(12)).toBe(undefined); // 6,6 always explodes again
    // we start to hit floating point errors here, so assert 10 decimal places
    expect(dist.get(13)).toBeCloseTo((1 / 6) ** 3, 10); // 6,6,1
  });

  it("adds extra die on crit for vicious", () => {
    const vicious = parseDiceNotation("1d4v");
    if (!vicious) throw new Error("Failed to parse dice notation");
    const dist = calculateProbabilityDistribution(vicious);

    expect(dist.get(0)).toBe(1 / 4);
    expect(dist.get(1)).toBe(undefined);
    expect(dist.get(2)).toBe(1 / 4);
    expect(dist.get(3)).toBe(1 / 4);
    expect(dist.get(4)).toBe(undefined);
    expect(dist.get(5)).toBe(undefined);
    expect(dist.get(6)).toBe((1 / 4) ** 3); // 4,1,1
    expect(dist.get(7)).toBe(2 * (1 / 4) ** 3); // 4,1,v=2 or 4,2,v=1

    // 4,4,1,v=4; 4,4,2,v=3; 4,4,3,v=2
    expect(dist.get(13)).toBeCloseTo(3 * (1 / 4) ** 4, 10);
  });
});
