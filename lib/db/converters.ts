import type { Prisma } from "@/lib/prisma";
import { toItemMini } from "@/lib/services/items/converters";
import type {
  Ability,
  Action,
  CollectionOverview,
  Companion,
  CompanionMini,
  FamilyOverview,
  Subclass,
  SubclassAbility,
  SubclassLevel,
  SubclassMini,
  User,
} from "@/lib/types";
import { toMonsterMini } from "../services/monsters/converters";
import type { prisma } from "./index";

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
    ...toCompanionMini(c),
    kind: c.kind,
    class: c.class,
    size: c.size,
    saves: c.saves,
    updatedAt: c.updatedAt,
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

export const toSubclassMini = (
  s: Prisma.Result<typeof prisma.subclass, object, "findMany">[0]
): SubclassMini => ({
  id: s.id,
  name: s.name,
  className: s.className as SubclassMini["className"],
  namePreface: s.namePreface || undefined,
  tagline: s.tagline || undefined,
  visibility: s.visibility,
  createdAt: s.createdAt,
});

export const toSubclass = (
  s: Prisma.Result<
    typeof prisma.subclass,
    {
      include: {
        creator: true;
        abilities: true;
      };
    },
    "findMany"
  >[0]
): Subclass => {
  // Group abilities by level and convert to SubclassLevel format
  const levelGroups = s.abilities.reduce(
    (acc, ability) => {
      if (!acc[ability.level]) {
        acc[ability.level] = [];
      }
      acc[ability.level].push({
        id: ability.id,
        name: ability.name,
        description: ability.description,
      });
      return acc;
    },
    {} as Record<number, SubclassAbility[]>
  );

  // Convert to levels array, sorted by level
  const levels: SubclassLevel[] = Object.entries(levelGroups)
    .map(([level, abilities]) => ({
      level: parseInt(level, 10),
      abilities,
    }))
    .sort((a, b) => a.level - b.level);

  return {
    ...toSubclassMini(s),
    description: s.description || undefined,
    levels,
    creator: toUser(s.creator),
    updatedAt: s.updatedAt,
  };
};
