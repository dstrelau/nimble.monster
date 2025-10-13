import type { Prisma } from "@/lib/prisma";
import { toItemMini } from "@/lib/services/items/converters";
import type {
  Ability,
  Action,
  CollectionOverview,
  Companion,
  CompanionMini,
  FamilyOverview,
  Spell,
  SpellSchool,
  SpellSchoolMini,
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

export const toSpellSchoolMini = (
  s: Prisma.Result<typeof prisma.spellSchool, object, "findMany">[0]
): SpellSchoolMini => ({
  id: s.id,
  name: s.name,
  visibility: s.visibility,
  createdAt: s.createdAt,
});

export const toSpellSchool = (
  s: Prisma.Result<
    typeof prisma.spellSchool,
    {
      include: {
        creator: true;
        spells: true;
      };
    },
    "findMany"
  >[0]
): SpellSchool => {
  return {
    ...toSpellSchoolMini(s),
    description: s.description || undefined,
    spells: s.spells.map((spell) => {
      let target: Spell["target"];
      if (spell.targetType === "self") {
        target = { type: "self" };
      } else if (
        spell.targetType === "aoe" &&
        spell.targetKind &&
        spell.targetDistance
      ) {
        target = {
          type: "aoe",
          kind: spell.targetKind as "range" | "reach" | "line" | "cone",
          distance: spell.targetDistance,
        };
      } else if (spell.targetType && spell.targetKind && spell.targetDistance) {
        target = {
          type: spell.targetType as "single" | "single+" | "multi" | "special",
          kind: spell.targetKind as "range" | "reach",
          distance: spell.targetDistance,
        };
      }

      return {
        id: spell.id,
        schoolId: spell.schoolId,
        name: spell.name,
        tier: spell.tier,
        actions: spell.actions,
        reaction: spell.reaction,
        target,
        damage: spell.damage || undefined,
        description: spell.description,
        highLevels: spell.highLevels || undefined,
        concentration: spell.concentration || undefined,
        upcast: spell.upcast || undefined,
        createdAt: spell.createdAt,
        updatedAt: spell.updatedAt,
      };
    }),
    creator: toUser(s.creator),
    updatedAt: s.updatedAt,
  };
};

export const toSpell = (
  s: Prisma.Result<
    typeof prisma.spell,
    {
      include: {
        school: {
          include: {
            creator: true;
          };
        };
      };
    },
    "findMany"
  >[0]
): Spell => {
  let target: Spell["target"];
  if (s.targetType === "self") {
    target = { type: "self" };
  } else if (s.targetType === "aoe" && s.targetKind && s.targetDistance) {
    target = {
      type: "aoe",
      kind: s.targetKind as "range" | "reach" | "line" | "cone",
      distance: s.targetDistance,
    };
  } else if (s.targetType && s.targetKind && s.targetDistance) {
    target = {
      type: s.targetType as "single" | "single+" | "multi" | "special",
      kind: s.targetKind as "range" | "reach",
      distance: s.targetDistance,
    };
  }

  return {
    id: s.id,
    schoolId: s.schoolId,
    name: s.name,
    tier: s.tier,
    actions: s.actions,
    reaction: s.reaction,
    target,
    damage: s.damage || undefined,
    description: s.description,
    highLevels: s.highLevels || undefined,
    concentration: s.concentration || undefined,
    upcast: s.upcast || undefined,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    school: s.school
      ? {
          id: s.school.id,
          name: s.school.name,
          description: s.school.description || undefined,
          visibility: s.school.visibility,
          spells: [], // Not populated for single spell queries
          creator: toUser(s.school.creator),
          createdAt: s.school.createdAt,
          updatedAt: s.school.updatedAt,
        }
      : undefined,
  };
};
