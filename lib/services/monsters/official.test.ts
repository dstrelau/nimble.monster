import { describe, expect, it } from "vitest";
import type { JSONAPIMonster } from "@/lib/api/monsters";
import { parseJSONAPIMonster } from "./official";

function makeMonster(
  overrides: Partial<JSONAPIMonster["attributes"]> = {}
): JSONAPIMonster {
  return {
    type: "monsters",
    attributes: {
      name: "Test Monster",
      hp: 10,
      level: 1,
      size: "medium",
      armor: "none",
      legendary: false,
      movement: [{ speed: 6 }],
      abilities: [],
      actions: [],
      actionsInstructions: "",
      ...overrides,
    },
  };
}

describe("parseJSONAPIMonster - minion detection", () => {
  it("sets minion true when minion attribute is true", () => {
    const result = parseJSONAPIMonster(makeMonster({ minion: true }));
    expect(result.minion).toBe(true);
  });

  it("sets minion false when minion attribute is false", () => {
    const result = parseJSONAPIMonster(makeMonster({ minion: false }));
    expect(result.minion).toBe(false);
  });

  it("sets minion true when subtype is 'minion' and minion is absent", () => {
    const result = parseJSONAPIMonster(makeMonster({ subtype: "minion" }));
    expect(result.minion).toBe(true);
  });

  it("sets minion false when subtype is 'standard' and minion is absent", () => {
    const result = parseJSONAPIMonster(makeMonster({ subtype: "standard" }));
    expect(result.minion).toBe(false);
  });

  it("sets minion false when neither minion nor subtype is present", () => {
    const result = parseJSONAPIMonster(makeMonster());
    expect(result.minion).toBe(false);
  });

  it("does not override explicit minion:false with subtype:'minion'", () => {
    const result = parseJSONAPIMonster(
      makeMonster({ minion: false, subtype: "minion" })
    );
    expect(result.minion).toBe(false);
  });
});
