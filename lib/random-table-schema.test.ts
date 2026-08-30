import { describe, expect, it } from "vitest";
import { parseTableNotation, tableNotationRange } from "@/lib/dice";
import { RandomTableSchema } from "@/lib/random-table-schema";

const range = (notation: string) => {
  const roll = parseTableNotation(notation);
  if (!roll) throw new Error(`failed to parse ${notation}`);
  return tableNotationRange(roll);
};

const table = (subtables: unknown[]) => ({
  name: "Combat Encounter",
  description: "",
  visibility: "public" as const,
  subtables,
});

describe("parseTableNotation", () => {
  it("accepts a bare die with no count", () => {
    expect(parseTableNotation("d8")).toMatchObject({ numDice: 1, dieSize: 8 });
  });

  it("accepts a count prefix", () => {
    expect(parseTableNotation("2d12")).toMatchObject({
      numDice: 2,
      dieSize: 12,
    });
  });

  it("rejects attack-only flags, which do not apply to table rolls", () => {
    expect(parseTableNotation("1d8v")).toBeNull();
    expect(parseTableNotation("2d20a")).toBeNull();
    expect(parseTableNotation("3d6d2")).toBeNull();
  });

  it("rejects nonsense", () => {
    expect(parseTableNotation("d7")).toBeNull();
    expect(parseTableNotation("wolves")).toBeNull();
  });
});

describe("tableNotationRange", () => {
  it("starts at the number of dice, not 1", () => {
    expect(range("2d12")).toEqual({ min: 2, max: 24 });
    expect(range("3d6")).toEqual({ min: 3, max: 18 });
  });

  it("handles a single die", () => {
    expect(range("1d4")).toEqual({ min: 1, max: 4 });
    expect(range("d8")).toEqual({ min: 1, max: 8 });
  });

  it("reads tensOnes dice as digit pairs", () => {
    expect(range("d66")).toEqual({ min: 11, max: 66 });
  });

  it("applies a modifier to both ends", () => {
    expect(range("1d6+2")).toEqual({ min: 3, max: 8 });
  });
});

describe("RandomTableSchema", () => {
  it("accepts rows spanning a range and overlapping rows", () => {
    // The reference table overlaps at 8 (3-8 "Easy", then 8-18 "Medium").
    const result = RandomTableSchema.safeParse(
      table([
        {
          title: "Encounter Difficulty",
          notation: "2d12",
          rows: [
            { low: 2, high: 2, result: "Very Deadly" },
            { low: 3, high: 8, result: "Easy" },
            { low: 8, high: 18, result: "Medium" },
            { low: 24, high: 24, result: "Deadly" },
          ],
        },
      ])
    );
    expect(result.success).toBe(true);
  });

  it("rejects a row outside the range the dice can roll", () => {
    // 2d12 cannot roll a 1.
    const result = RandomTableSchema.safeParse(
      table([
        {
          title: "Encounter Difficulty",
          notation: "2d12",
          rows: [{ low: 1, high: 4, result: "Easy" }],
        },
      ])
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("2d12 rolls 2–24");
  });

  it("rejects a row whose high is below its low", () => {
    const result = RandomTableSchema.safeParse(
      table([
        {
          title: "Location",
          notation: "1d4",
          rows: [{ low: 3, high: 2, result: "Among the trees" }],
        },
      ])
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Must not be less than the low value"
    );
  });

  it("rejects invalid dice notation", () => {
    const result = RandomTableSchema.safeParse(
      table([
        {
          title: "Location",
          notation: "1d7",
          rows: [{ low: 1, high: 1, result: "A glade" }],
        },
      ])
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Not a valid die roll (e.g. 1d6, 2d12, d66)"
    );
  });

  it("requires at least one table with at least one row", () => {
    expect(RandomTableSchema.safeParse(table([])).success).toBe(false);
    expect(
      RandomTableSchema.safeParse(
        table([{ title: "Location", notation: "1d4", rows: [] }])
      ).success
    ).toBe(false);
  });
});
