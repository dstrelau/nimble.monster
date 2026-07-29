import { describe, expect, it } from "vitest";
import { validateOfficialAncestriesJSON } from "./official";

const ancestry = {
  type: "ancestries",
  attributes: {
    name: "Test Ancestry",
    size: ["medium"],
    rarity: "uncommon",
    description: "Description",
    abilities: [{ name: "Ability", description: "Ability description" }],
  },
};

describe("validateOfficialAncestriesJSON", () => {
  it("accepts uncommon ancestry rarity", () => {
    const result = validateOfficialAncestriesJSON({ data: [ancestry] });

    expect(result.ancestries[0].attributes.rarity).toBe("uncommon");
  });

  it("rejects unsupported ancestry rarity", () => {
    expect(() =>
      validateOfficialAncestriesJSON({
        data: [
          {
            ...ancestry,
            attributes: { ...ancestry.attributes, rarity: "rare" },
          },
        ],
      })
    ).toThrow('rarity must be "common", "uncommon", or "exotic"');
  });
});
