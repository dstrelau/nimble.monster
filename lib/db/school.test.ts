import { describe, expect, it } from "vitest";
import type { SpellTarget } from "@/lib/types";
import { buildSpellTarget, spellTargetToDbColumns } from "./school";

describe("buildSpellTarget", () => {
  it("returns undefined when targetType is null", () => {
    expect(buildSpellTarget({ targetType: null })).toBeUndefined();
  });

  it("returns self target", () => {
    expect(buildSpellTarget({ targetType: "self" })).toEqual({ type: "self" });
  });

  it("returns single target with range and distance", () => {
    expect(
      buildSpellTarget({
        targetType: "single",
        targetKind: "range",
        targetDistance: 30,
      })
    ).toEqual({ type: "single", kind: "range", distance: 30 });
  });

  it("returns single target with reach", () => {
    expect(
      buildSpellTarget({
        targetType: "single",
        targetKind: "reach",
        targetDistance: 5,
      })
    ).toEqual({ type: "single", kind: "reach", distance: 5 });
  });

  it("returns aoe target with cone", () => {
    expect(
      buildSpellTarget({
        targetType: "aoe",
        targetKind: "cone",
        targetDistance: 15,
      })
    ).toEqual({ type: "aoe", kind: "cone", distance: 15 });
  });

  it("returns multi target", () => {
    expect(
      buildSpellTarget({
        targetType: "multi",
        targetKind: "range",
        targetDistance: 60,
      })
    ).toEqual({ type: "multi", kind: "range", distance: 60 });
  });

  it("returns undefined distance when targetDistance is null", () => {
    const result = buildSpellTarget({
      targetType: "single",
      targetKind: "range",
      targetDistance: null,
    });
    expect(result).toEqual({
      type: "single",
      kind: "range",
      distance: undefined,
    });
  });

  it("returns undefined when targetKind is missing for non-self, non-aoe target", () => {
    expect(
      buildSpellTarget({ targetType: "single", targetKind: null })
    ).toBeUndefined();
  });
});

describe("spellTargetToDbColumns", () => {
  it("returns all undefined for undefined target", () => {
    expect(spellTargetToDbColumns(undefined)).toEqual({
      targetType: undefined,
      targetKind: undefined,
      targetDistance: undefined,
    });
  });

  it("maps self target", () => {
    const target: SpellTarget = { type: "self" };
    expect(spellTargetToDbColumns(target)).toEqual({
      targetType: "self",
      targetKind: undefined,
      targetDistance: undefined,
    });
  });

  it("maps single target with range and distance", () => {
    const target: SpellTarget = { type: "single", kind: "range", distance: 30 };
    expect(spellTargetToDbColumns(target)).toEqual({
      targetType: "single",
      targetKind: "range",
      targetDistance: 30,
    });
  });

  it("maps single target with reach", () => {
    const target: SpellTarget = { type: "single", kind: "reach", distance: 5 };
    expect(spellTargetToDbColumns(target)).toEqual({
      targetType: "single",
      targetKind: "reach",
      targetDistance: 5,
    });
  });

  it("maps aoe target with line", () => {
    const target: SpellTarget = { type: "aoe", kind: "line", distance: 60 };
    expect(spellTargetToDbColumns(target)).toEqual({
      targetType: "aoe",
      targetKind: "line",
      targetDistance: 60,
    });
  });

  it("maps multi target", () => {
    const target: SpellTarget = { type: "multi", kind: "range", distance: 60 };
    expect(spellTargetToDbColumns(target)).toEqual({
      targetType: "multi",
      targetKind: "range",
      targetDistance: 60,
    });
  });
});

describe("round-trip: spellTargetToDbColumns -> buildSpellTarget", () => {
  const targets: SpellTarget[] = [
    { type: "self" },
    { type: "single", kind: "range", distance: 30 },
    { type: "single", kind: "reach", distance: 5 },
    { type: "single+", kind: "range", distance: 60 },
    { type: "multi", kind: "range", distance: 60 },
    { type: "aoe", kind: "cone", distance: 15 },
    { type: "aoe", kind: "line", distance: 30 },
    { type: "aoe", kind: "reach", distance: 10 },
    { type: "special", kind: "range", distance: 0 },
  ];

  for (const target of targets) {
    it(`preserves ${JSON.stringify(target)}`, () => {
      const columns = spellTargetToDbColumns(target);
      const result = buildSpellTarget(columns);
      expect(result).toEqual(target);
    });
  }
});
