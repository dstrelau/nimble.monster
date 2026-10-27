import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createBestiaryEntrySchema } from "@/app/%5Factions/_bestiary/input";
import { familyInputSchema } from "@/app/%5Factions/_family/input";
import type { JSONAPIMonster } from "@/lib/api/monsters";
import { monsterToMarkdown } from "@/lib/export/markdown";
import { toJsonApiMonster } from "./converters";
import { compareMonsters } from "./diff";
import { parseJSONAPIMonster, validateOfficialMonstersJSON } from "./official";
import type { Monster } from "./types";

function officialMonster(name: string): JSONAPIMonster {
  const { monsters } = validateOfficialMonstersJSON(
    JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
  );
  const monster = monsters.find((m) => m.attributes.name === name);
  if (!monster) throw new Error(`Missing official monster ${name}`);
  return monster;
}

function importedMonster(data: JSONAPIMonster): Monster {
  const input = parseJSONAPIMonster(data);
  return {
    ...input,
    id: "00000000-0000-0000-0000-000000000001",
    hazard: false,
    armor: input.armor === "" ? "none" : input.armor,
    legendary: input.legendary ?? false,
    minion: input.minion ?? false,
    paperforgeId: input.paperforgeId ?? undefined,
    saves: input.saves?.join(" ") ?? "",
    families: [],
    creator: {
      id: "00000000-0000-0000-0000-000000000000",
      discordId: "",
      username: "nimble-co",
      displayName: "Nimble Co.",
    },
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

describe("structured monster attacks", () => {
  it("round-trips targets, areas and counts through import, edit validation and JSON:API export", () => {
    const data = officialMonster("Black Pudding");
    data.attributes.actions = [
      {
        name: "Acidic Touch",
        damage: { roll: "1d6+6" },
        description: "Digested.",
        target: { reach: 2 },
        attackCount: 2,
      },
    ];
    const monster = importedMonster(data);
    const edit = createBestiaryEntrySchema.parse({
      kind: "monster",
      input: parseJSONAPIMonster(data),
    });
    expect(edit.input.actions[0]).toMatchObject({
      target: { reach: 2 },
      attackCount: 2,
      damage: "1d6+6",
      description: "Digested.",
    });
    expect(monster.actions[0]).not.toHaveProperty("range");

    const exported = toJsonApiMonster(monster);
    const { monsters } = validateOfficialMonstersJSON({
      data: [{ type: "monsters", attributes: exported.attributes }],
    });
    // Structured fields survive; description keeps the legacy API format.
    expect(monsters[0].attributes.actions).toEqual([
      { ...data.attributes.actions[0], description: "1d6+6. Digested." },
    ]);
    expect(monsterToMarkdown(monster)).toContain("Acidic Touch (2×)");
    expect(monsterToMarkdown(monster)).toContain("Reach 2");
  });

  it.each([
    { width: undefined, expectedWidth: 1, label: "Line 6" },
    { width: 1, expectedWidth: 1, label: "Line 6" },
    { width: 3, expectedWidth: 3, label: "Line 3×6" },
  ])(
    "round-trips line width $width with length 6",
    ({ width, expectedWidth, label }) => {
      const data = officialMonster("Great Worm");
      data.attributes.actions = [
        {
          name: "Crush",
          damage: { roll: "d88" },
          area: {
            shape: "line",
            size: 6,
            ...(width === undefined ? {} : { width }),
          },
          description: "Damage on a failed DC 18 DEX save.",
        },
      ];
      const { monsters } = validateOfficialMonstersJSON({ data: [data] });
      const input = parseJSONAPIMonster(monsters[0]);
      const edit = createBestiaryEntrySchema.parse({ kind: "monster", input });
      const expectedArea = { shape: "line", size: 6, width: expectedWidth };
      expect(edit.input.actions[0].area).toEqual(expectedArea);
      const monster = importedMonster(monsters[0]);
      const exported = toJsonApiMonster(monster);
      expect(exported.attributes.actions[0].area).toEqual(expectedArea);
      const reimported = validateOfficialMonstersJSON({
        data: [{ type: "monsters", attributes: exported.attributes }],
      });
      expect(
        parseJSONAPIMonster(reimported.monsters[0]).actions[0].area
      ).toEqual(expectedArea);
      expect(monsterToMarkdown(monster)).toContain(`**Crush** (d88, ${label})`);
      expect(monsterToMarkdown(monster, { brief: true })).toContain(
        `**Crush.** d88 (${label}).`
      );
      expect(monsterToMarkdown(monster)).not.toContain(`${label} AoE`);
    }
  );

  it("preserves alternate ranged attacks without making the melee attack ranged", () => {
    const goblin = officialMonster("Goblin");
    goblin.attributes.actions = [
      {
        name: "Stab",
        damage: { roll: "1d6" },
        alternative: { name: "Shoot", target: { range: 8 } },
        description: "Can’t crit.",
      },
    ];
    const imported = parseJSONAPIMonster(goblin);
    expect(imported.actions[0].target).toBeUndefined();
    expect(imported.actions[0].alternative).toEqual({
      name: "Shoot",
      target: { range: 8 },
    });
    expect(
      toJsonApiMonster(importedMonster(goblin)).attributes.actions[0]
    ).toMatchObject({ alternative: { name: "Shoot", target: { range: 8 } } });
  });

  it("rejects attack fields on abilities and strips legacy fields during conversion", () => {
    const drake = officialMonster("Blue Drake");
    const legacyAbility = {
      name: "Burst Lightning",
      target: { reach: 1 },
      aoe: false,
      damage: "2d8",
      range: "1",
      area: { shape: "square", size: 2 },
      attackCount: 2,
      alternative: { name: "Burst", target: { range: 3 } },
      description: "On death, Reach 1, AoE: 2d8 (ignores metal armor).",
    };
    drake.attributes.abilities = [legacyAbility];
    expect(() => validateOfficialMonstersJSON({ data: [drake] })).toThrow(
      /abilities/
    );
    const input = parseJSONAPIMonster(drake);
    expect(input.abilities[0]).toEqual({
      id: expect.any(String),
      name: legacyAbility.name,
      description: legacyAbility.description,
    });
    expect(
      createBestiaryEntrySchema.safeParse({
        kind: "monster",
        input: { ...input, abilities: [{ ...legacyAbility, id: "ability" }] },
      }).success
    ).toBe(false);
    expect(
      toJsonApiMonster(importedMonster(drake)).attributes.abilities[0]
    ).toEqual({
      name: legacyAbility.name,
      description: legacyAbility.description,
    });
  });

  it.each([
    { target: { range: 0 } },
    { target: { reach: 2, range: 8 } },
    { attackCount: 0 },
    { attackCount: 2.5 },
    { area: { shape: "line", width: 0, size: 4 } },
    { area: { shape: "line", width: -1, size: 4 } },
    { area: { shape: "line", width: 1.5, size: 4 } },
    { area: { shape: "line", width: "3", size: 4 } },
    { area: { shape: "line", width: null, size: 4 } },
    { area: { shape: "square", width: 3, size: 4 } },
    { area: { shape: "cone", width: 3, size: 4 } },
    { target: { range: 7 }, area: { shape: "cone", size: 4 } },
    { aoe: true, area: { shape: "line", size: 4 } },
  ])(
    "rejects malformed attack metadata during import and editing: %j",
    (metadata) => {
      const data = officialMonster("Black Pudding");
      const action = { ...data.attributes.actions[0], ...metadata };
      const input = parseJSONAPIMonster(data);
      expect(
        createBestiaryEntrySchema.safeParse({
          kind: "monster",
          input: { ...input, actions: [{ ...input.actions[0], ...metadata }] },
        }).success
      ).toBe(false);
      expect(
        familyInputSchema.safeParse({
          name: "Family",
          abilities: [
            {
              id: "ability",
              name: "Ability",
              description: "Effect.",
              ...metadata,
            },
          ],
        }).success
      ).toBe(false);
      expect(() =>
        validateOfficialMonstersJSON({
          data: [
            {
              type: "monsters",
              attributes: { ...data.attributes, actions: [action] },
            },
          ],
          included: [],
        })
      ).toThrow(/actions/);
    }
  );

  it("detects metadata-only changes during import preview", () => {
    const data = officialMonster("Great Worm");
    data.attributes.actions[0].area = { shape: "line", size: 4 };
    const original = importedMonster(data);
    const changed = structuredClone(original);
    changed.actions[0].area = { shape: "line", size: 6 };
    expect(compareMonsters(changed, original)).toBe("updated");
    changed.actions[0].area = { size: 4, shape: "line" };
    expect(compareMonsters(changed, original)).toBe("unchanged");
    changed.actions[0].area = { shape: "line", size: 4, width: 1 };
    expect(compareMonsters(changed, original)).toBe("unchanged");
    changed.actions[0].area = { shape: "line", size: 4, width: 3 };
    expect(compareMonsters(changed, original)).toBe("updated");
  });
});
