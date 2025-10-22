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
      advantage: 0,
      disadvantage: 0,
    });
  });

  it("parses dice with positive modifier", () => {
    const result = parseDiceNotation("3d6+2");
    expect(result).toEqual({
      numDice: 3,
      dieSize: 6,
      modifier: 2,
      vicious: false,
      advantage: 0,
      disadvantage: 0,
    });
  });

  it("parses dice with negative modifier", () => {
    const result = parseDiceNotation("2d4-1");
    expect(result).toEqual({
      numDice: 2,
      dieSize: 4,
      modifier: -1,
      vicious: false,
      advantage: 0,
      disadvantage: 0,
    });
  });

  it("parses vicious dice without modifier", () => {
    const result = parseDiceNotation("1d8v");
    expect(result).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: true,
      advantage: 0,
      disadvantage: 0,
    });
  });

  it("parses vicious dice with modifier", () => {
    const result = parseDiceNotation("3d6v+2");
    expect(result).toEqual({
      numDice: 3,
      dieSize: 6,
      modifier: 2,
      vicious: true,
      advantage: 0,
      disadvantage: 0,
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
      advantage: 0,
      disadvantage: 0,
    });
  });

  it("rejects both advantage and disadvantage", () => {
    expect(parseDiceNotation("1d6ad")).toBeNull();
    expect(parseDiceNotation("1d6a1d1")).toBeNull();
    expect(parseDiceNotation("1d6da")).toBeNull();
  });

  it("rejects advantage >= 7", () => {
    expect(parseDiceNotation("1d6a7")).toBeNull();
    expect(parseDiceNotation("1d6a8")).toBeNull();
    expect(parseDiceNotation("1d6a10")).toBeNull();
  });

  it("rejects disadvantage >= 7", () => {
    expect(parseDiceNotation("1d6d7")).toBeNull();
    expect(parseDiceNotation("1d6d8")).toBeNull();
    expect(parseDiceNotation("1d6d10")).toBeNull();
  });

  it("accepts advantage/disadvantage up to 6", () => {
    expect(parseDiceNotation("1d6a6")).not.toBeNull();
    expect(parseDiceNotation("1d6d6")).not.toBeNull();
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

  it("handles advantage notation parsing", () => {
    const basic = parseDiceNotation("1d6a");
    expect(basic).toEqual({
      numDice: 1,
      dieSize: 6,
      modifier: 0,
      vicious: false,
      advantage: 1,
      disadvantage: 0,
    });

    const explicit = parseDiceNotation("1d6a2");
    expect(explicit).toEqual({
      numDice: 1,
      dieSize: 6,
      modifier: 0,
      vicious: false,
      advantage: 2,
      disadvantage: 0,
    });

    const withVicious = parseDiceNotation("1d8va1");
    expect(withVicious).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: true,
      advantage: 1,
      disadvantage: 0,
    });

    const withViciousReversed = parseDiceNotation("1d8a1v");
    expect(withViciousReversed).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: true,
      advantage: 1,
      disadvantage: 0,
    });

    const withModifier = parseDiceNotation("2d4a1+3");
    expect(withModifier).toEqual({
      numDice: 2,
      dieSize: 4,
      modifier: 3,
      vicious: false,
      advantage: 1,
      disadvantage: 0,
    });

    const allFlags = parseDiceNotation("1d6va2+5");
    expect(allFlags).toEqual({
      numDice: 1,
      dieSize: 6,
      modifier: 5,
      vicious: true,
      advantage: 2,
      disadvantage: 0,
    });

    const allFlagsReversed = parseDiceNotation("1d6a2v-1");
    expect(allFlagsReversed).toEqual({
      numDice: 1,
      dieSize: 6,
      modifier: -1,
      vicious: true,
      advantage: 2,
      disadvantage: 0,
    });
  });

  it("handles disadvantage notation parsing", () => {
    const basic = parseDiceNotation("1d6d");
    expect(basic).toEqual({
      numDice: 1,
      dieSize: 6,
      modifier: 0,
      vicious: false,
      advantage: 0,
      disadvantage: 1,
    });

    const explicit = parseDiceNotation("1d6d2");
    expect(explicit).toEqual({
      numDice: 1,
      dieSize: 6,
      modifier: 0,
      vicious: false,
      advantage: 0,
      disadvantage: 2,
    });

    const withVicious = parseDiceNotation("1d8vd1");
    expect(withVicious).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: true,
      advantage: 0,
      disadvantage: 1,
    });

    const withViciousReversed = parseDiceNotation("1d8d1v");
    expect(withViciousReversed).toEqual({
      numDice: 1,
      dieSize: 8,
      modifier: 0,
      vicious: true,
      advantage: 0,
      disadvantage: 1,
    });

    const withModifier = parseDiceNotation("2d4d1+3");
    expect(withModifier).toEqual({
      numDice: 2,
      dieSize: 4,
      modifier: 3,
      vicious: false,
      advantage: 0,
      disadvantage: 1,
    });
  });

  it("calculates distribution for 1d6a (advantage)", () => {
    const roll = parseDiceNotation("1d6a");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    // With advantage, we roll 2d6 and keep the max.
    // P(max=k) = probability both dice are ≤ k minus the probability both
    // dice are ≤ k-1 (inclusion-exclusion principle)
    // (k/6)^2 = probability both dice ≤ k
    // ((k-1)/6)^2 = probability both dice ≤ k-1
    // P(max=k) = (k/6)^2 - ((k-1)/6)^2
    expect(dist.get(0)).toBeCloseTo((1 / 6) ** 2, 10); // both dice = 1
    expect(dist.get(2)).toBeCloseTo((2 / 6) ** 2 - (1 / 6) ** 2, 10);
    expect(dist.get(3)).toBeCloseTo((3 / 6) ** 2 - (2 / 6) ** 2, 10);
    expect(dist.get(4)).toBeCloseTo((4 / 6) ** 2 - (3 / 6) ** 2, 10);
    expect(dist.get(5)).toBeCloseTo((5 / 6) ** 2 - (4 / 6) ** 2, 10);

    // Rolling max=6 triggers explosion
    // P(max=6) = 1 - (5/6)^2 = 11/36
    const pMax6 = 1 - (5 / 6) ** 2;
    expect(dist.get(7)).toBeCloseTo(pMax6 * (1 / 6), 10); // 6 then 1
    expect(dist.get(8)).toBeCloseTo(pMax6 * (1 / 6), 10); // 6 then 2
  });

  it("calculates distribution for 2d4a1", () => {
    const roll = parseDiceNotation("2d4a1");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    // Roll 3d4, keep highest 2
    // Highest becomes primary die, can explode/crit/miss
    // Second highest is added as regular die

    // Primary die is 1 when dice[0]=1, dice[1]=1, dice[2]=any
    // (dice[0] gets dropped due to tie-breaking, dice[1] becomes primary)
    expect(dist.get(0)).toBeCloseTo(4 / 64, 10);

    // For total = 9, there are multiple ways:
    // primary=4 explodes to 5 (4+1), second=4: 5+4=9
    // primary=4 explodes to 6 (4+2), second=3: 6+3=9
    // primary=4 explodes to 7 (4+3), second=2: 7+2=9

    // Count cases where primary die (first kept by index) is 4
    const p_primary4_second4 = 10 / 64; // All 10 cases with kept=[4,4]
    const p_primary4_second3 = 8 / 64; // Only 8 of 15 {4,3} cases have primary=4
    const p_primary4_second2 = 5 / 64; // Only 5 of 9 {4,2} cases have primary=4

    const expectedP9 =
      p_primary4_second4 * (1 / 4) + // explosion to 5
      p_primary4_second3 * (1 / 4) + // explosion to 6
      p_primary4_second2 * (1 / 4); // explosion to 7

    expect(dist.get(9)).toBeCloseTo(expectedP9, 10);
  });

  it("calculates distribution for 1d4a2 (multiple advantage)", () => {
    const roll = parseDiceNotation("1d4a2");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    // Roll 3d4, keep highest 1 (max of 3d4)
    // P(max=4) = 1 - (3/4)^3 = 37/64
    const pMax4 = 1 - (3 / 4) ** 3;

    // P(all three dice are 1) = (1/4)^3 = 1/64
    expect(dist.get(0)).toBeCloseTo((1 / 4) ** 3, 10);

    // P(max=2) = (2/4)^3 - (1/4)^3 = 8/64 - 1/64 = 7/64
    expect(dist.get(2)).toBeCloseTo((2 / 4) ** 3 - (1 / 4) ** 3, 10);

    // When max=4, it explodes
    // P(4 then 1) = pMax4 * 1/4
    expect(dist.get(5)).toBeCloseTo(pMax4 * (1 / 4), 10); // 4+1
  });

  it("calculates distribution for 1d6d (disadvantage)", () => {
    const roll = parseDiceNotation("1d6d");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    // With disadvantage, we roll 2d6 and keep the min.
    // P(min=k) = probability both dice are ≥ k minus the probability both
    // dice are ≥ k+1
    // ((7-k)/6)^2 = probability both dice ≥ k
    // P(min=k) = ((7-k)/6)^2 - ((6-k)/6)^2

    // P(min=1) = 1 - (5/6)^2 = 11/36
    expect(dist.get(0)).toBeCloseTo(1 - (5 / 6) ** 2, 10); // both = 1 -> miss

    expect(dist.get(2)).toBeCloseTo((5 / 6) ** 2 - (4 / 6) ** 2, 10);
    expect(dist.get(3)).toBeCloseTo((4 / 6) ** 2 - (3 / 6) ** 2, 10);
    expect(dist.get(4)).toBeCloseTo((3 / 6) ** 2 - (2 / 6) ** 2, 10);
    expect(dist.get(5)).toBeCloseTo((2 / 6) ** 2 - (1 / 6) ** 2, 10);

    // Rolling min=6 (both dice are 6) triggers explosion
    const pMin6 = (1 / 6) ** 2;
    expect(dist.get(7)).toBeCloseTo(pMin6 * (1 / 6), 10); // 6 then 1
    expect(dist.get(8)).toBeCloseTo(pMin6 * (1 / 6), 10); // 6 then 2
  });

  it("calculates distribution for 1d4d2 (multiple disadvantage)", () => {
    const roll = parseDiceNotation("1d4d2");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    // Roll 3d4, keep lowest 1 (min of 3d4)
    // P(min=1) = 1 - (3/4)^3 = 37/64
    const pMin1 = 1 - (3 / 4) ** 3;

    // P(all three dice are 1) = (1/4)^3 = 1/64 -> miss
    expect(dist.get(0)).toBeCloseTo(pMin1, 10);

    // P(min=2) = (3/4)^3 - (2/4)^3
    expect(dist.get(2)).toBeCloseTo((3 / 4) ** 3 - (2 / 4) ** 3, 10);

    // P(min=3) = (2/4)^3 - (1/4)^3
    expect(dist.get(3)).toBeCloseTo((2 / 4) ** 3 - (1 / 4) ** 3, 10);

    // When min=4 (all dice are 4), it explodes
    const pMin4 = (1 / 4) ** 3;
    expect(dist.get(5)).toBeCloseTo(pMin4 * (1 / 4), 10); // 4+1
  });

  it("probabilities sum to 1.0 for basic dice", () => {
    const roll = parseDiceNotation("1d6");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });

  it("probabilities sum to 1.0 for advantage", () => {
    const roll = parseDiceNotation("1d6a");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });

  it("probabilities sum to 1.0 for multiple advantage", () => {
    const roll = parseDiceNotation("1d4a2");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("probabilities sum to 1.0 for disadvantage", () => {
    const roll = parseDiceNotation("1d6d");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 4);
  });

  it("probabilities sum to 1.0 for multiple disadvantage", () => {
    const roll = parseDiceNotation("1d4d2");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });

  it("probabilities sum to 1.0 for multiple dice with advantage", () => {
    const roll = parseDiceNotation("2d4a1");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("probabilities sum to 1.0 for vicious dice", () => {
    const roll = parseDiceNotation("1d4v");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("probabilities sum to 1.0 for vicious with advantage", () => {
    const roll = parseDiceNotation("1d6va");
    if (!roll) throw new Error("Failed to parse");
    const dist = calculateProbabilityDistribution(roll);

    const sum = Array.from(dist.values()).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
  });
});
