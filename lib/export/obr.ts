import type { Collection, Monster } from "@/lib/types";

interface OBRCompendiumFeature {
  name: string;
  description: string;
}

interface OBRCompendiumNimbleMonster {
  name: string;
  type: string;
  level?: string;
  hp?: number;
  armor?: string | null;
  features?: OBRCompendiumFeature[];
  attacks?: OBRCompendiumFeature[];
}

export interface OBRCompendiumPack {
  name: string;
  id: string;
  version: string;
  documents: OBRCompendiumNimbleMonster[];
}

export const convertMonsterToOBR = (
  monster: Monster
): OBRCompendiumNimbleMonster => {
  // Convert armor format to match OBR expectations
  let armor: string | null = null;
  if (monster.armor === "medium") {
    armor = "Medium";
  } else if (monster.armor === "heavy") {
    armor = "Heavy";
  }

  return {
    name: monster.name,
    type: "nimblev2-monster",
    level: monster.level,
    hp:
      typeof monster.hp === "string"
        ? Number.parseInt(monster.hp, 10)
        : monster.hp,
    armor,
    features: monster.abilities.map((ability) => ({
      name: ability.name,
      description: ability.description,
    })),
    attacks: monster.actions.map((action) => ({
      name: action.name,
      description: [action.damage, action.description]
        .filter(Boolean)
        .join(" "),
    })),
  };
};

export const generateCompendiumPack = (
  collection: Collection
): OBRCompendiumPack => {
  const monsters = collection.monsters.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return {
    name: collection.name,
    id: collection.id,
    version: collection.createdAt
      ? collection.createdAt.getTime().toString()
      : Date.now().toString(),
    documents: monsters.map(convertMonsterToOBR),
  };
};
