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

  it("sets minion false when minion attribute is absent", () => {
    const result = parseJSONAPIMonster(makeMonster());
    expect(result.minion).toBe(false);
  });
});
