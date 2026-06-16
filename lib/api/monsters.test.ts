import { describe, expect, it } from "vitest";
import type { JSONAPIMonster } from "./monsters";
import { parseMonster } from "./monsters";

function makeMonster(
  overrides: Partial<JSONAPIMonster["attributes"]> = {}
): JSONAPIMonster {
  return {
    type: "monsters",
    id: "test-id",
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

describe("parseMonster - minion detection", () => {
  it("sets minion true when minion attribute is true", () => {
    const result = parseMonster(makeMonster({ minion: true }));
    expect(result.minion).toBe(true);
  });

  it("sets minion false when minion attribute is false", () => {
    const result = parseMonster(makeMonster({ minion: false }));
    expect(result.minion).toBe(false);
  });

  it("sets minion true when subtype is 'minion' and minion is absent", () => {
    const result = parseMonster(makeMonster({ subtype: "minion" }));
    expect(result.minion).toBe(true);
  });

  it("sets minion false when subtype is 'standard' and minion is absent", () => {
    const result = parseMonster(makeMonster({ subtype: "standard" }));
    expect(result.minion).toBe(false);
  });

  it("sets minion false when neither minion nor subtype is present", () => {
    const result = parseMonster(makeMonster());
    expect(result.minion).toBe(false);
  });

  it("does not override explicit minion:false with subtype:'minion'", () => {
    const result = parseMonster(
      makeMonster({ minion: false, subtype: "minion" })
    );
    expect(result.minion).toBe(false);
  });
});
