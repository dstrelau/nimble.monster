import { describe, expect, it } from "vitest";
import {
  type JSONAPISpell,
  validateOfficialSpellSchoolsJSON,
} from "@/lib/services/spell-schools/official";
import core from "./spell-schools.json";

// Transcribed independently from Core Rules 3.0, printed pages 46–53.
// Each tuple is [name, tier, actions]; utility cantrips are listed separately.
const printedSchools = [
  {
    name: "Fire Spells",
    spells: [
      ["Flame Dart", 0, 1],
      ["Heart's Fire", 0, 1],
      ["Ignite", 1, 2],
      ["Enchant Weapon", 2, 1],
      ["Flame Barrier", 3, 0],
      ["Pyroclasm", 4, 2],
      ["Fiery Embrace", 5, 2],
      ["Living Inferno", 7, 3],
      ["Dragonform", 9, 5],
    ],
    utility: [
      ["Firebrand", 0, 1],
      ["Fire Step", 0, 0],
      ["Kindle", 0, 1],
    ],
  },
  {
    name: "Ice Spells",
    spells: [
      ["Ice Lance", 0, 1],
      ["Snowblind", 0, 1],
      ["Frost Shield", 1, 0],
      ["Shatter", 2, 2],
      ["Omenrime", 3, 1],
      ["Rimeblades", 4, 3],
      ["Arctic Blast", 5, 2],
      ["Glacier Strike", 8, 3],
      ["Arctic Annihilation", 9, 3],
    ],
    utility: [
      ["Chillcraft", 0, 1],
      ["Ice Disk", 0, 0],
      ["Wintry Scrying", 0, 0],
    ],
  },
  {
    name: "Lightning Spells",
    spells: [
      ["Zap", 0, 1],
      ["Overload", 0, 1],
      ["Arc Lightning", 1, 2],
      ["Alacrity", 2, 0],
      ["Stormlash", 3, 2],
      ["Electrickery", 4, 3],
      ["Electrocharge", 5, 2],
      ["Ride the Lightning", 6, 3],
      ["Seething Storm", 9, 3],
    ],
    utility: [
      ["Spark Buddy", 0, 0],
      ["Spark Step", 0, 1],
      ["Tempest's Command", 0, 1],
    ],
  },
  {
    name: "Wind Spells",
    spells: [
      ["Razor Wind", 0, 1],
      ["Breath of Life", 0, 1],
      ["Blustery Gale", 1, 2],
      ["Barrier of Wind", 2, 0],
      ["Echoburst", 3, 2],
      ["Eye of the Storm", 4, 2],
      ["Updraft", 5, 2],
      ["Thousand Cuts", 6, 3],
      ["Boisterous Winds", 7, 2],
    ],
    utility: [
      ["Wind Whisper", 0, 1],
      ["Helpful Gust", 0, 1],
      ["Feather Fall", 0, 1],
    ],
  },
  {
    name: "Radiant Spells",
    spells: [
      ["Rebuke", 0, 1],
      ["True Strike", 0, 1],
      ["Heal", 1, 1],
      ["Warding Bond", 2, 0],
      ["Condemn", 3, 1],
      ["Shield of Justice", 4, 0],
      ["Vengeance", 5, 2],
      ["Sacrifice", 6, 1],
      ["Celestial Legion", 7, 1],
      ["Redeem", 9, 0],
    ],
    utility: [
      ["Light", 0, 1],
      ["Beautify", 0, 1],
      ["Bond of Peace", 0, 1],
    ],
  },
  {
    name: "Necrotic Spells",
    spells: [
      ["Entice", 0, 1],
      ["Withering Touch", 0, 1],
      ["Shadow Trap", 1, 1],
      ["Dread Visage", 2, 0],
      ["Vampiric Greed", 3, 2],
      ["Vigor Mortis", 4, 1],
      ["Gangrenous Burst", 5, 2],
      ["Unspeakable Word", 6, 2],
      ["Creeping Death", 7, 3],
    ],
    utility: [
      ["Gravecraft", 0, 0],
      ["False Face", 0, 0],
      ["Thought Leech", 0, 1],
    ],
  },
];

const { spellSchools } = validateOfficialSpellSchoolsJSON(
  structuredClone(core)
);
const spells = spellSchools.flatMap((s) => s.attributes.spells);

function spell(name: string): JSONAPISpell {
  const result = spells.find((s) => s.name === name);
  if (!result) throw new Error(`Missing spell: ${name}`);
  return result;
}

describe("Core Rules 3.0 spell data", () => {
  it("is accepted by the official import validator", () => {
    const result = validateOfficialSpellSchoolsJSON(structuredClone(core));
    expect(result.source).toMatchObject({
      name: "Core Rules 3.0",
      abbreviation: "Core3",
    });
    expect(result.spellSchools).toHaveLength(6);
    expect(spells).toHaveLength(90);
    expect(spells.filter((s) => (s.version ?? 3) === 3)).toHaveLength(73);
    expect(new Set(spells.map((s) => s.name)).size).toBe(90);
  });

  it("retains the removed spells as version 2", () => {
    expect(
      spells
        .filter((s) => s.version === 2)
        .map((s) => s.name)
        .sort()
    ).toEqual([
      "Cryosleep",
      "Cryotomb",
      "Fly",
      "Greater Shadow",
      "Greater Windform",
      "Hearth & Home",
      "Lesser Windform",
      "Lifebinding Spirit",
      "Memory Veil",
      "Radiant Bond",
      "Revive",
      "Shadow Blast",
      "Sparkfetch",
      "Speak With Dead",
      "Summon Shadow",
      "Teleport",
      "Vicious Mockery",
    ]);
    expect(spell("Cryosleep")).toMatchObject({
      version: 2,
      tier: 3,
      actions: 2,
      upcast: "+1 area, +1 turn asleep.",
    });
    expect(spell("Shadow Blast").damage).toBe("1d12+KEY. 1/round.");
  });

  it.each([
    0,
    1,
    2.5,
    4,
    "2",
    null,
  ])("rejects invalid spell version %s", (version) => {
    expect(() =>
      validateOfficialSpellSchoolsJSON({
        data: [
          {
            type: "spell-schools",
            attributes: {
              name: "Test school",
              spells: [{ name: "Test spell", tier: 0, actions: 1, version }],
            },
          },
        ],
      })
    ).toThrow("version must be 2 or 3");
  });

  it.each(
    printedSchools
  )("matches the printed $name roster, tiers, costs, and utility flags", ({
    name,
    spells: combat,
    utility,
  }) => {
    const school = core.data.find((s) => s.attributes.name === name);
    expect(school).toBeDefined();
    for (const [isUtility, expected] of [
      [false, combat],
      [true, utility],
    ] satisfies [boolean, (string | number)[][]][]) {
      const actual = school?.attributes.spells
        .filter((s) => !("version" in s) || s.version !== 2)
        .filter((s) => Boolean("utility" in s && s.utility) === isUtility)
        .map((s) => [s.name, s.tier, s.actions]);
      expect(actual).toHaveLength(expected.length);
      expect(actual).toEqual(expect.arrayContaining(expected));
    }
  });

  it("uses the revised ranges and dice rather than v2 values", () => {
    expect(spell("Flame Dart").target?.distance).toBe(10);
    expect(spell("Ignite").target?.distance).toBe(10);
    expect(spell("Enchant Weapon").target).toEqual({
      type: "single",
      kind: "reach",
      distance: 8,
    });
    expect(spell("Zap")).toMatchObject({
      target: { distance: 8 },
      damage: "1d8+4. On miss: you take half the damage instead.",
    });
    expect(spell("Heal").description).toContain("1d8+KEY HP");
    expect(spell("Rebuke").damage).toBe(
      "1d8 (ignoring armor). 2× damage against undead or cowardly (those Frightened or behind Cover)."
    );
    expect(spell("Razor Wind").damage).toBe(
      "2d4 slashing, with advantage OR include a 2nd creature adjacent to your target."
    );
  });

  it.each([
    "Flame Barrier",
    "Frost Shield",
    "Dread Visage",
    "Shield of Justice",
    "Barrier of Wind",
  ])("requires Defending for %s without granting a free Defend", (name) => {
    expect(spell(name)).toMatchObject({ actions: 0, reaction: true });
    expect(spell(name).description).toContain("Castable only while Defending");
    expect(spell(name).description).not.toContain("Defend for free");
  });

  it("keeps changed condition, save, and upcast mechanics", () => {
    expect(spell("Overload").description).toBe(
      "Castable only if Charged, ending the condition."
    );
    expect(spell("Frost Shield").upcast).toBe("+5 temp HP.");
    expect(spell("Frost Shield").highLevels).toBeUndefined();
    expect(spell("Vampiric Greed").description).toContain(
      "each creature that survived this damage"
    );
    expect(spell("Vampiric Greed").description).not.toContain("STR save");
    expect(spell("Unspeakable Word").description).toContain(
      "On save, the opposite happens instead."
    );
    expect(spell("Creeping Death").upcast).toBe("+10 damage.");
    expect(spell("Boisterous Winds").concentration).toBeUndefined();
    expect(spell("Updraft").damage).toBe(
      "20 bludgeoning minus a DEX save to creatures in a 5×5 area. On 10+ damage, they land Prone and Dazed."
    );
  });

  it("preserves non-action casting times and flexible utility limits", () => {
    expect(spell("Wintry Scrying").description).toContain(
      "Casting Time: 1 minute."
    );
    expect(spell("Ice Disk").description).toContain("moderately heavy weight");
    expect(spell("Wind Whisper").description).toContain(
      "anywhere wind could reach"
    );
    expect(spell("Spark Step").description).toContain("Reach: 4.");
    expect(spell("Redeem").description).toContain("Casting Time: 1 day.");
  });
});
