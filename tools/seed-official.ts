// Seed official content from data/official, reusing the admin upload flow's
// validate + upsert logic (app/admin/actions.ts). Idempotent. Run via
// `pnpm run db:seed`.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as sourceDb from "@/lib/db/source";
import { checkpoint } from "@/lib/db/client";
import { validateOfficialAncestriesJSON } from "@/lib/services/ancestries/official";
import { upsertOfficialAncestry } from "@/lib/services/ancestries/repository";
import { validateOfficialBackgroundsJSON } from "@/lib/services/backgrounds/official";
import { upsertOfficialBackground } from "@/lib/services/backgrounds/repository";
import { validateOfficialClassesJSON } from "@/lib/services/classes/official";
import { upsertOfficialClass } from "@/lib/services/classes/repository";
import { ensureOfficialUser } from "@/lib/services/ensure-official-user";
import {
  findOrCreateOfficialFamily,
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import { upsertOfficialMonster } from "@/lib/services/monsters/repository";
import { validateOfficialSpellSchoolsJSON } from "@/lib/services/spell-schools/official";
import { upsertOfficialSpellSchool } from "@/lib/services/spell-schools/repository";
import { validateOfficialSubclassesJSON } from "@/lib/services/subclasses/official";
import { upsertOfficialSubclass } from "@/lib/services/subclasses/repository";

const DATA_DIR = join(process.cwd(), "data", "official");

// Classes before subclasses (subclasses reference their class by name).
const FILES = [
  "core/ancestries.json",
  "core/backgrounds.json",
  "core/spell-schools.json",
  "heroes/classes.json",
  "other/hexbinder-class.json",
  "heroes/subclasses.json",
  "heroes/story-subclasses.json",
  "other/hexbinder-subclasses.json",
  "other/hexbinder-spells.json",
  "gmg/bestiary.json",
];

function readJSON(relPath: string): unknown {
  return JSON.parse(readFileSync(join(DATA_DIR, relPath), "utf8"));
}

async function resolveSourceId(
  source:
    | Parameters<typeof sourceDb.findOrCreateSource>[0]
    | undefined
): Promise<string | undefined> {
  if (!source) return undefined;
  return sourceDb.findOrCreateSource(source);
}

async function seedMonsters(json: unknown): Promise<number> {
  const { monsters, families, source } = validateOfficialMonstersJSON(json);
  const sourceId = await resolveSourceId(source);

  const familyIdMap = new Map<string, string>();
  for (const [familyRefId, familyData] of families.entries()) {
    const familyId = await findOrCreateOfficialFamily(
      familyData.attributes.name,
      familyData.attributes.description,
      familyData.attributes.abilities
    );
    familyIdMap.set(familyRefId, familyId);
  }

  for (const monsterData of monsters) {
    const input = parseJSONAPIMonster(monsterData);
    const familyRefId = monsterData.relationships?.family?.data?.id;
    if (familyRefId) {
      const familyId = familyIdMap.get(familyRefId);
      if (familyId) {
        input.families = [{ id: familyId }];
      }
    }
    if (sourceId) {
      input.sourceId = sourceId;
    }
    await upsertOfficialMonster(input);
  }

  return monsters.length;
}

async function seedAncestries(json: unknown): Promise<number> {
  const { ancestries, source } = validateOfficialAncestriesJSON(json);
  const sourceId = await resolveSourceId(source);

  for (const ancestry of ancestries) {
    await upsertOfficialAncestry({
      name: ancestry.attributes.name,
      description: ancestry.attributes.description,
      size: ancestry.attributes.size,
      rarity: ancestry.attributes.rarity,
      abilities: ancestry.attributes.abilities,
      sourceId,
    });
  }

  return ancestries.length;
}

async function seedBackgrounds(json: unknown): Promise<number> {
  const { backgrounds, source } = validateOfficialBackgroundsJSON(json);
  const sourceId = await resolveSourceId(source);

  for (const bg of backgrounds) {
    await upsertOfficialBackground({
      name: bg.attributes.name,
      description: bg.attributes.description,
      requirement: bg.attributes.requirement,
      sourceId,
    });
  }

  return backgrounds.length;
}

async function seedClasses(json: unknown): Promise<number> {
  const { classes: classesData, source } = validateOfficialClassesJSON(json);
  const sourceId = await resolveSourceId(source);

  for (const cls of classesData) {
    await upsertOfficialClass({
      name: cls.attributes.name,
      description: cls.attributes.description,
      keyStats: cls.attributes.keyStats,
      hitDie: cls.attributes.hitDie,
      startingHp: cls.attributes.startingHp,
      saves: cls.attributes.saves,
      armor: cls.attributes.armor,
      weapons: cls.attributes.weapons,
      startingGear: cls.attributes.startingGear,
      levels: cls.attributes.levels,
      abilityLists: cls.attributes.abilityLists,
      sourceId,
    });
  }

  return classesData.length;
}

async function seedSubclasses(json: unknown): Promise<number> {
  const { subclasses, source } = validateOfficialSubclassesJSON(json);
  const sourceId = await resolveSourceId(source);

  for (const sc of subclasses) {
    await upsertOfficialSubclass({
      name: sc.attributes.name,
      className: sc.attributes.className,
      tagline: sc.attributes.tagline,
      description: sc.attributes.description,
      levels: sc.attributes.levels,
      sourceId,
    });
  }

  return subclasses.length;
}

async function seedSpellSchools(json: unknown): Promise<number> {
  const { spellSchools, source } = validateOfficialSpellSchoolsJSON(json);
  const sourceId = await resolveSourceId(source);

  for (const school of spellSchools) {
    await upsertOfficialSpellSchool({
      id: school.id,
      name: school.attributes.name,
      description: school.attributes.description,
      // Target normalization mirrors app/admin/actions.ts.
      spells: school.attributes.spells.map((s) => ({
        ...s,
        target: s.target
          ? s.target.type === "self"
            ? { type: "self" as const }
            : s.target.type === "aoe"
              ? {
                  type: "aoe" as const,
                  kind:
                    s.target.kind === "line" || s.target.kind === "cone"
                      ? ("range" as const)
                      : s.target.kind || ("range" as const),
                  distance: s.target.distance,
                }
              : {
                  type: s.target.type,
                  kind:
                    s.target.kind === "line" || s.target.kind === "cone"
                      ? ("range" as const)
                      : s.target.kind || ("range" as const),
                  distance: s.target.distance,
                }
          : undefined,
      })),
      sourceId,
    });
  }

  return spellSchools.length;
}

async function seedFile(relPath: string): Promise<void> {
  const json = readJSON(relPath);
  const firstType = (json as { data?: Array<{ type?: string }> }).data?.[0]
    ?.type;

  let count: number;
  switch (firstType) {
    case "monsters":
      count = await seedMonsters(json);
      break;
    case "ancestries":
      count = await seedAncestries(json);
      break;
    case "backgrounds":
      count = await seedBackgrounds(json);
      break;
    case "classes":
      count = await seedClasses(json);
      break;
    case "subclasses":
      count = await seedSubclasses(json);
      break;
    case "spell-schools":
      count = await seedSpellSchools(json);
      break;
    default:
      throw new Error(`${relPath}: unknown content type "${firstType}"`);
  }

  console.log(`  ${relPath}: seeded ${count} ${firstType}`);
}

export async function seedOfficial(): Promise<void> {
  console.log("Seeding official content from data/official ...");
  await ensureOfficialUser();

  for (const relPath of FILES) {
    await seedFile(relPath);
  }

  await checkpoint();
  console.log("Official content seeded.");
}
