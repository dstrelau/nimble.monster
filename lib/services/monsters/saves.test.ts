import { describe, expect, it } from "vitest";
import { parseSaves } from "./saves";

describe("parseSaves", () => {
  it("returns empty object for undefined input", () => {
    expect(parseSaves(undefined)).toEqual({});
  });

  it("returns empty object for empty string", () => {
    expect(parseSaves("")).toEqual({});
  });

  it("returns empty object for whitespace-only string", () => {
    expect(parseSaves("   ")).toEqual({});
  });

  it("parses single + modifier", () => {
    expect(parseSaves("STR+")).toEqual({ str: 1 });
  });

  it("parses double + modifier", () => {
    expect(parseSaves("STR++")).toEqual({ str: 2 });
  });

  it("parses single - modifier", () => {
    expect(parseSaves("DEX-")).toEqual({ dex: -1 });
  });

  it("parses double - modifier", () => {
    expect(parseSaves("CON--")).toEqual({ con: -2 });
  });

  it("handles lowercase ability abbreviations", () => {
    expect(parseSaves("str+")).toEqual({ str: 1 });
    expect(parseSaves("dex++")).toEqual({ dex: 2 });
  });

  it("handles mixed case ability abbreviations", () => {
    expect(parseSaves("Str+")).toEqual({ str: 1 });
    expect(parseSaves("DEX++")).toEqual({ dex: 2 });
  });

  it("parses multiple saves separated by spaces", () => {
    expect(parseSaves("STR+ DEX++")).toEqual({ str: 1, dex: 2 });
  });

  it("parses multiple saves separated by commas", () => {
    expect(parseSaves("STR+,DEX++")).toEqual({ str: 1, dex: 2 });
  });

  it("parses multiple saves separated by comma and space", () => {
    expect(parseSaves("STR+, DEX++")).toEqual({ str: 1, dex: 2 });
  });

  it("parses all six ability saves", () => {
    expect(parseSaves("STR+ DEX++ CON- INT-- WIS+++ CHA---")).toEqual({
      str: 1,
      dex: 2,
      con: -1,
      int: -2,
      wis: 3,
      cha: -3,
    });
  });

  it("ignores invalid ability abbreviations", () => {
    expect(parseSaves("STR+ ABC+ DEX++")).toEqual({ str: 1, dex: 2 });
  });

  it("ignores entries without modifiers", () => {
    expect(parseSaves("STR+ DEX")).toEqual({ str: 1 });
  });

  it("ignores entries with only ability name", () => {
    expect(parseSaves("STR")).toEqual({});
  });

  it("handles mixed + and - in a single entry (net value)", () => {
    // "STR+-" should net to 0, which is skipped
    expect(parseSaves("STR+-")).toEqual({});
    // "STR+++-" should net to 2
    expect(parseSaves("STR+++-")).toEqual({ str: 2 });
  });

  it("handles extra whitespace between entries", () => {
    expect(parseSaves("  STR+   DEX++  ")).toEqual({ str: 1, dex: 2 });
  });

  it("handles multiple commas and spaces", () => {
    expect(parseSaves("STR+,  ,DEX++, , CON-")).toEqual({
      str: 1,
      dex: 2,
      con: -1,
    });
  });
});
