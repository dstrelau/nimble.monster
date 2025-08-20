import type { Prisma } from "@/lib/prisma";
import type {
  Ability,
  Action,
  CollectionOverview,
  Family,
  Monster,
  MonsterMini,
} from "@/lib/types";
import type { prisma } from "./index";

export const toMonsterMini = (
  m: Prisma.Result<typeof prisma.monster, object, "findMany">[0]
): MonsterMini => ({
  id: m.id,
  hp: m.hp,
  legendary: m.legendary,
  level: m.level,
  name: m.name,
  visibility: m.visibility,
});

export const toMonster = (
  m: Prisma.Result<
    typeof prisma.monster,
    {
      include: {
        family: true;
        creator: true;
        monsterConditions: { include: { condition: true } };
      };
    },
    "findMany"
  >[0]
): Monster => {
  return {
    id: m.id,
    name: m.name,
    hp: m.hp,
    legendary: m.legendary,
    level: m.level,
    visibility: m.visibility,
    kind: m.kind,
    bloodied: m.bloodied,
    lastStand: m.lastStand,
    speed: m.speed,
    fly: m.fly,
    swim: m.swim,
    climb: m.climb,
    teleport: m.teleport,
    burrow: m.burrow,
    size: m.size,
    saves: m.saves.join(" "),
    armor: m.armor === "EMPTY_ENUM_VALUE" ? "none" : m.armor,
    updatedAt: m.updatedAt.toISOString(),
    abilities: m.abilities as unknown as Ability[],
    actions: m.actions as unknown as Action[],
    actionPreface: m.actionPreface || "",
    moreInfo: m.moreInfo || "",
    family: toFamily(m.family),
    creator: { ...m.creator, avatar: m.creator.avatar || "" },
    conditions: m.monsterConditions.map((mc) => ({
      name: mc.condition.name,
      description: mc.condition.description,
      official: mc.condition.official,
      inline: mc.inline,
    })),
  };
};

export const toFamily = (
  f: Prisma.Result<typeof prisma.family, object, "findMany">[0] | null
): Family | undefined => {
  if (!f) {
    return undefined;
  }
  return {
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    abilities: f.abilities as unknown as Ability[],
    visibility: f.visibility,
    creatorId: f.creatorId,
  };
};

export const toCollectionOverview = (
  c: Prisma.Result<
    typeof prisma.collection,
    {
      include: {
        creator: true;
        monsterCollections: {
          include: {
            monster: true;
          };
        };
      };
    },
    "findMany"
  >[0]
): CollectionOverview => {
  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary
  ).length;
  return {
    id: c.id,
    creator: {
      discordId: c.creator.discordId,
      avatar: c.creator.avatar || "",
      username: c.creator.username,
    },
    description: c.description ?? undefined,
    legendaryCount,
    monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
    name: c.name,
    standardCount: c.monsterCollections.length - legendaryCount,
    visibility: c.visibility === "private" ? "private" : "public",
    createdAt: c.createdAt ?? undefined,
  };
};
