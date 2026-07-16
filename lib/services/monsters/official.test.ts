import { describe, expect, it } from "vitest";
import type { JSONAPIMonster } from "@/lib/api/monsters";
import { parseJSONAPIMonster, validateOfficialMonstersJSON } from "./official";

function doc(attributes: Record<string, unknown>) {
  return {
    data: [
      {
        type: "monsters",
        attributes: { name: "Goblin", hp: 10, level: 1, ...attributes },
      },
    ],
  };
}

describe("validateOfficialMonstersJSON version fields", () => {
  it("accepts an explicit version number and description", () => {
    const result = validateOfficialMonstersJSON(
      doc({ version: 2, versionDescription: "Rebalanced HP" })
    );
    expect(result.monsters).toHaveLength(1);
    expect(result.monsters[0].attributes.version).toBe(2);
    expect(result.monsters[0].attributes.versionDescription).toBe(
      "Rebalanced HP"
    );
  });

  it("accepts a monster with no version fields (unchanged behaviour)", () => {
    const result = validateOfficialMonstersJSON(doc({}));
    expect(result.monsters).toHaveLength(1);
    expect(result.monsters[0].attributes.version).toBeUndefined();
  });

  it.each([
    0, -1, 1.5,
  ])("rejects non-positive-integer version %p", (version) => {
    expect(() => validateOfficialMonstersJSON(doc({ version }))).toThrow(
      /version must be a positive integer/
    );
  });

  it("rejects a non-string version description", () => {
    expect(() =>
      validateOfficialMonstersJSON(doc({ versionDescription: 5 }))
    ).toThrow(/versionDescription must be a string/);
  });
});

describe("parseJSONAPIMonster version mapping", () => {
  it("threads version number and description into the input", () => {
    const monster: JSONAPIMonster = {
      type: "monsters",
      attributes: {
        name: "Goblin",
        hp: 10,
        level: 1,
        size: "small",
        armor: "none",
        legendary: false,
        movement: [{ speed: 6 }],
        abilities: [],
        actions: [],
        actionsInstructions: "",
        version: 3,
        versionDescription: "Nerfed damage",
      },
    };

    const input = parseJSONAPIMonster(monster);

    expect(input.versionNumber).toBe(3);
    expect(input.versionDescription).toBe("Nerfed damage");
  });

  it("leaves version fields undefined when absent", () => {
    const monster: JSONAPIMonster = {
      type: "monsters",
      attributes: {
        name: "Goblin",
        hp: 10,
        level: 1,
        size: "small",
        armor: "none",
        legendary: false,
        movement: [{ speed: 6 }],
        abilities: [],
        actions: [],
        actionsInstructions: "",
      },
    };

    const input = parseJSONAPIMonster(monster);

    expect(input.versionNumber).toBeUndefined();
    expect(input.versionDescription).toBeUndefined();
  });
});
