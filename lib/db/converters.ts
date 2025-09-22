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
  ItemRarity,
  Monster,
  MonsterMini,
  User,
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
  levelInt: m.levelInt,
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
    updatedAt: m.updatedAt,
    abilities: (m.abilities as unknown as Omit<Ability, "id">[]).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    actions: (m.actions as unknown as Omit<Action, "id">[]).map((action) => ({
      ...action,
      id: crypto.randomUUID(),
    })),
    actionPreface: m.actionPreface || "",
    moreInfo: m.moreInfo || "",
    family: toFamilyOverview(m.family),
    creator: toUser(m.creator),
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
    abilities: (f.abilities as unknown as Omit<Ability, "id">[]).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: f.visibility,
    creatorId: f.creatorId,
    creator: toUser(f.creator),
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
        itemCollections: {
          include: {
            item: true;
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
    creator: toUser(c.creator),
    description: c.description ?? undefined,
    legendaryCount,
    monsters: c.monsterCollections.map((mc) => toMonsterMini(mc.monster)),
    name: c.name,
    standardCount: c.monsterCollections.length - legendaryCount,
    visibility: c.visibility === "private" ? "private" : "public",
    createdAt: c.createdAt ?? undefined,
    items: c.itemCollections?.map((ic) => toItemMini(ic.item)) || [],
    itemCount: c.itemCollections?.length || 0,
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
    abilities: (c.abilities as unknown as Omit<Ability, "id">[]).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    actions: (c.actions as unknown as Omit<Action, "id">[]).map((action) => ({
      ...action,
      id: crypto.randomUUID(),
    })),
    actionPreface: c.actionPreface || "",
    dyingRule: c.dyingRule,
    moreInfo: c.moreInfo || "",
    creator: toUser(c.creator),
  };
};

export const toItemMini = (
  i: Prisma.Result<typeof prisma.item, object, "findMany">[0]
): ItemMini => ({
  id: i.id,
  name: i.name,
  kind: i.kind || undefined,
  rarity: i.rarity as ItemRarity,
  visibility: i.visibility,
  imageIcon: i.imageIcon || undefined,
  imageColor: i.imageColor || undefined,
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
    ...toItemMini(i),
    imageBgIcon: i.imageBgIcon || undefined,
    imageBgColor: i.imageBgColor || undefined,
    description: i.description,
    moreInfo: i.moreInfo || undefined,
    updatedAt: i.updatedAt.toISOString(),
    creator: toUser(i.creator),
  };
};

export const toUser = (
  u: Prisma.Result<
    typeof prisma.user,
    {
      include: {
        avatar: true;
      };
    },
    "findMany"
  >[0]
): User => ({
  id: u.id,
  discordId: u.discordId,
  username: u.username,
  displayName: u.displayName || u.username,
  imageUrl:
    u.imageUrl ||
    (u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png"),
});
