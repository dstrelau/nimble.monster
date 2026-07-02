import type { MonsterMini } from "@/lib/services/monsters/types";
import type { EncounterOverview } from "@/lib/types";
import { uuidToIdentifier } from "@/lib/utils/slug";

const toJsonApiMonsterMini = (m: MonsterMini) => ({
  type: "monsters",
  id: uuidToIdentifier(m.id),
  attributes: {
    name: m.name,
    level: m.level,
    levelInt: m.levelInt,
    hp: m.hp,
    hpPerHero: m.hpPerHero,
    armor: m.armor,
    size: m.size,
    legendary: m.legendary,
    minion: m.minion,
    role: m.role,
  },
  links: {
    self: `/api/monsters/${uuidToIdentifier(m.id)}`,
  },
});

export const toJsonApiEncounter = (e: EncounterOverview) => {
  return {
    type: "encounters",
    id: uuidToIdentifier(e.id),
    attributes: {
      name: e.name,
      description: e.description,
      createdAt: e.createdAt?.toISOString(),
      heroCount: e.heroCount,
      heroLevel: e.heroLevel,
      monsterCount: e.monsters.length,
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: uuidToIdentifier(e.creator.id),
        },
      },
    },
    links: {
      self: `/api/encounters/${uuidToIdentifier(e.id)}`,
    },
  };
};

export const toJsonApiEncounterWithMonsters = (e: EncounterOverview) => {
  const base = {
    type: "encounters",
    id: uuidToIdentifier(e.id),
    attributes: {
      name: e.name,
      description: e.description,
      createdAt: e.createdAt?.toISOString(),
      heroCount: e.heroCount,
      heroLevel: e.heroLevel,
      monsterCount: e.monsters.length,
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: uuidToIdentifier(e.creator.id),
        },
      },
      monsters: {
        data: e.monsters.map(({ monster, quantity, isPerHero }) => ({
          type: "monsters",
          id: uuidToIdentifier(monster.id),
          meta: { quantity, isPerHero },
        })),
      },
    },
    links: {
      self: `/api/encounters/${uuidToIdentifier(e.id)}`,
    },
  };

  const included = e.monsters.map(({ monster }) =>
    toJsonApiMonsterMini(monster)
  );

  return { data: base, included };
};
