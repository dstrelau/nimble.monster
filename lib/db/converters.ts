import type { Prisma } from "@/lib/prisma";
import type {
  Ability,
  Action,
  CollectionOverview,
  Companion,
  CompanionMini,
  FamilyOverview,
  Item,
  ItemMini,
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
  minion: m.minion,
  level: m.level,
  name: m.name,
  visibility: m.visibility,
  size: m.size,
  armor: m.armor === "EMPTY_ENUM_VALUE" ? "none" : m.armor,
});

export const toMonster = (
  m: Prisma.Result<
    typeof prisma.monster,
    {
      include: {
        family: { include: { creator: true } };
        creator: true;
      };
    },
    "findMany"
  >[0]
): Monster => {
  return {
    ...toMonsterMini(m),
    kind: m.kind,
    bloodied: m.bloodied,
    lastStand: m.lastStand,
    speed: m.speed,
    fly: m.fly,
    swim: m.swim,
    climb: m.climb,
    teleport: m.teleport,
    burrow: m.burrow,
    saves: m.saves.join(" "),
    updatedAt: m.updatedAt.toISOString(),
    abilities: m.abilities as unknown as Ability[],
    actions: (m.actions as unknown as Omit<Action, "id">[]).map((action) => ({
      ...action,
      id: crypto.randomUUID(),
    })),
    actionPreface: m.actionPreface || "",
    moreInfo: m.moreInfo || "",
    family: toFamilyOverview(m.family),
    creator: { ...m.creator, avatar: m.creator.avatar || "" },
  };
};

export const toFamilyOverview = (
  f:
    | Prisma.Result<
        typeof prisma.family,
        { include: { creator: true } },
        "findMany"
      >[0]
    | null
): FamilyOverview | undefined => {
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
    creator: { ...f.creator, avatar: f.creator.avatar || "" },
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

export const toCompanionMini = (
  c: Prisma.Result<typeof prisma.companion, object, "findMany">[0]
): CompanionMini => ({
  id: c.id,
  name: c.name,
  hp_per_level: c.hp_per_level,
  wounds: c.wounds,
  visibility: c.visibility,
});

export const toCompanion = (
  c: Prisma.Result<
    typeof prisma.companion,
    {
      include: {
        creator: true;
      };
    },
    "findMany"
  >[0]
): Companion => {
  return {
    id: c.id,
    name: c.name,
    hp_per_level: c.hp_per_level,
    wounds: c.wounds,
    visibility: c.visibility,
    kind: c.kind,
    class: c.class,
    size: c.size,
    saves: c.saves,
    updatedAt: c.updatedAt.toISOString(),
    abilities: c.abilities as unknown as Ability[],
    actions: (c.actions as unknown as Omit<Action, "id">[]).map((action) => ({
      ...action,
      id: crypto.randomUUID(),
    })),
    actionPreface: c.actionPreface || "",
    dyingRule: c.dyingRule,
    moreInfo: c.moreInfo || "",
    creator: { ...c.creator, avatar: c.creator.avatar || "" },
  };
};

export const toItemMini = (
  i: Prisma.Result<typeof prisma.item, object, "findMany">[0]
): ItemMini => ({
  id: i.id,
  name: i.name,
  kind: i.kind || undefined,
  visibility: i.visibility,
});

export const toItem = (
  i: Prisma.Result<
    typeof prisma.item,
    {
      include: {
        creator: true;
      };
    },
    "findMany"
  >[0]
): Item => {
  return {
    id: i.id,
    name: i.name,
    kind: i.kind || undefined,
    visibility: i.visibility,
    description: i.description,
    moreInfo: i.moreInfo || undefined,
    imageIcon: i.imageIcon || undefined,
    updatedAt: i.updatedAt.toISOString(),
    creator: { ...i.creator, avatar: i.creator.avatar || "" },
  };
};
