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

const parseJsonField = <T>(value: unknown): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

// Generic type for family with creator
interface FamilyWithCreator {
  id: string;
  name: string;
  description: string | null;
  abilities: unknown;
  visibility: string | null;
  creatorId: string;
  creator: UserRow;
}

// Generic type for user row
interface UserRow {
  id: string;
  discordId: string | null;
  username: string | null;
  displayName: string | null;
  imageUrl: string | null;
  avatar: string | null;
}

// Generic type for collection with relations
interface CollectionWithRelations {
  id: string;
  name: string;
  description: string | null;
  visibility: string | null;
  createdAt: string | null;
  creator: UserRow;
  monsterCollections: Array<{
    monster: {
      legendary: boolean | null;
      [key: string]: unknown;
    };
  }>;
  itemCollections?: Array<{
    item: { [key: string]: unknown };
  }>;
}

// Generic type for companion row
interface CompanionRow {
  id: string;
  name: string;
  kind: string;
  class: string;
  hpPerLevel: string;
  wounds: number;
  size: string;
  saves: string;
  visibility: string | null;
  abilities: unknown;
  actions: unknown;
  actionPreface: string | null;
  dyingRule: string;
  moreInfo: string | null;
  updatedAt: string | null;
  creator: UserRow;
  source: {
    id: string;
    name: string;
    abbreviation: string;
    license: string;
    link: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  companionAwards?: Array<{
    award: AwardRow;
  }>;
}

// Generic type for award row
interface AwardRow {
  id: string;
  slug: string;
  name: string;
  abbreviation: string;
  description: string | null;
  url: string;
  color: string;
  icon: string;
  createdAt: string | null;
  updatedAt: string | null;
}

// Generic type for subclass row
interface SubclassRow {
  id: string;
  name: string;
  className: string;
  namePreface: string | null;
  tagline: string | null;
  description: string | null;
  visibility: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  creator: UserRow;
  source: {
    id: string;
    name: string;
    abbreviation: string;
    license: string;
    link: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  abilities: Array<{
    id: string;
    level: number;
    name: string;
    description: string;
  }>;
  subclassAwards?: Array<{
    award: AwardRow;
  }>;
}

// Generic type for spell school row
interface SpellSchoolRow {
  id: string;
  name: string;
  description: string | null;
  visibility: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  creator: UserRow;
  source: {
    id: string;
    name: string;
    abbreviation: string;
    license: string;
    link: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  spells: Array<SpellDbRow>;
  schoolAwards?: Array<{
    award: AwardRow;
  }>;
}

// Generic type for spell row
interface SpellDbRow {
  id: string;
  schoolId: string;
  name: string;
  tier: number;
  actions: number;
  reaction: boolean | null;
  targetType: string | null;
  targetKind: string | null;
  targetDistance: number | null;
  damage: string | null;
  description: string | null;
  highLevels: string | null;
  concentration: string | null;
  upcast: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface SpellWithSchool extends SpellDbRow {
  school: {
    id: string;
    name: string;
    description: string | null;
    visibility: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    creator: UserRow;
  };
}

export const toFamilyOverview = (
  f: FamilyWithCreator | null
): FamilyOverview | undefined => {
  if (!f) {
    return undefined;
  }
  return {
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    abilities: parseJsonField<Omit<Ability, "id">>(f.abilities).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: f.visibility as FamilyOverview["visibility"],
    creatorId: f.creatorId,
    creator: toUser(f.creator),
  };
};

export const toCollectionOverview = (
  c: CollectionWithRelations
): CollectionOverview => {
  const legendaryCount = c.monsterCollections.filter(
    (m) => m.monster.legendary
  ).length;
  return {
    id: c.id,
    creator: toUser(c.creator),
    description: c.description ?? undefined,
    legendaryCount,
    monsters: c.monsterCollections.map((mc) =>
      toMonsterMini(mc.monster as never)
    ),
    name: c.name,
    standardCount: c.monsterCollections.length - legendaryCount,
    visibility: c.visibility === "private" ? "private" : "public",
    createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
    items: c.itemCollections?.map((ic) => toItemMini(ic.item as never)) || [],
    itemCount: c.itemCollections?.length || 0,
    spellSchools: [],
  };
};

export const toCompanionMini = (
  c: Pick<CompanionRow, "id" | "name" | "hpPerLevel" | "wounds" | "visibility">
): CompanionMini => ({
  id: c.id,
  name: c.name,
  hp_per_level: c.hpPerLevel,
  wounds: c.wounds,
  visibility: c.visibility as CompanionMini["visibility"],
});

export const toCompanion = (c: CompanionRow): Companion => {
  return {
    ...toCompanionMini(c),
    kind: c.kind,
    class: c.class,
    size: c.size as Companion["size"],
    saves: c.saves,
    updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    abilities: parseJsonField<Omit<Ability, "id">>(c.abilities).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    actions: parseJsonField<Omit<Action, "id">>(c.actions).map((action) => ({
      ...action,
      id: crypto.randomUUID(),
    })),
    actionPreface: c.actionPreface || "",
    dyingRule: c.dyingRule,
    moreInfo: c.moreInfo || "",
    creator: toUser(c.creator),
    source: c.source
      ? {
          ...c.source,
          createdAt: c.source.createdAt
            ? new Date(c.source.createdAt)
            : new Date(),
          updatedAt: c.source.updatedAt
            ? new Date(c.source.updatedAt)
            : new Date(),
        }
      : undefined,
    awards:
      c.companionAwards?.map((ca) => ({
        id: ca.award.id,
        slug: ca.award.slug,
        name: ca.award.name,
        abbreviation: ca.award.abbreviation,
        description: ca.award.description,
        url: ca.award.url,
        color: ca.award.color,
        icon: ca.award.icon,
        createdAt: ca.award.createdAt
          ? new Date(ca.award.createdAt)
          : new Date(),
        updatedAt: ca.award.updatedAt
          ? new Date(ca.award.updatedAt)
          : new Date(),
      })) || undefined,
  };
};

export const toUser = (u: UserRow): User => ({
  id: u.id,
  discordId: u.discordId ?? "",
  username: u.username ?? "",
  displayName: u.displayName || u.username || "",
  imageUrl:
    u.imageUrl ||
    (u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png"),
});

export const toSubclassMini = (
  s: Pick<
    SubclassRow,
    | "id"
    | "name"
    | "className"
    | "namePreface"
    | "tagline"
    | "visibility"
    | "createdAt"
  >
): SubclassMini => ({
  id: s.id,
  name: s.name,
  className: s.className as SubclassMini["className"],
  namePreface: s.namePreface || undefined,
  tagline: s.tagline || undefined,
  visibility: s.visibility as SubclassMini["visibility"],
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

export const toSubclass = (s: SubclassRow): Subclass => {
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
    source: s.source
      ? {
          ...s.source,
          createdAt: s.source.createdAt
            ? new Date(s.source.createdAt)
            : new Date(),
          updatedAt: s.source.updatedAt
            ? new Date(s.source.updatedAt)
            : new Date(),
        }
      : undefined,
    awards:
      s.subclassAwards?.map((sa) => ({
        id: sa.award.id,
        slug: sa.award.slug,
        name: sa.award.name,
        abbreviation: sa.award.abbreviation,
        description: sa.award.description,
        url: sa.award.url,
        color: sa.award.color,
        icon: sa.award.icon,
        createdAt: sa.award.createdAt
          ? new Date(sa.award.createdAt)
          : new Date(),
        updatedAt: sa.award.updatedAt
          ? new Date(sa.award.updatedAt)
          : new Date(),
      })) || undefined,
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
  };
};

export const toSpellSchoolMini = (
  s: Pick<SpellSchoolRow, "id" | "name" | "visibility" | "createdAt">
): SpellSchoolMini => ({
  id: s.id,
  name: s.name,
  visibility: s.visibility as SpellSchoolMini["visibility"],
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

export const toSpellSchool = (s: SpellSchoolRow): SpellSchool => {
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
        reaction: spell.reaction ?? false,
        target,
        damage: spell.damage || undefined,
        description: spell.description || undefined,
        highLevels: spell.highLevels || undefined,
        concentration: spell.concentration || undefined,
        upcast: spell.upcast || undefined,
        createdAt: spell.createdAt ? new Date(spell.createdAt) : new Date(),
        updatedAt: spell.updatedAt ? new Date(spell.updatedAt) : new Date(),
      };
    }),
    creator: toUser(s.creator),
    source: s.source
      ? {
          ...s.source,
          createdAt: s.source.createdAt
            ? new Date(s.source.createdAt)
            : new Date(),
          updatedAt: s.source.updatedAt
            ? new Date(s.source.updatedAt)
            : new Date(),
        }
      : undefined,
    awards:
      s.schoolAwards?.map((sa) => ({
        id: sa.award.id,
        slug: sa.award.slug,
        name: sa.award.name,
        abbreviation: sa.award.abbreviation,
        description: sa.award.description,
        url: sa.award.url,
        color: sa.award.color,
        icon: sa.award.icon,
        createdAt: sa.award.createdAt
          ? new Date(sa.award.createdAt)
          : new Date(),
        updatedAt: sa.award.updatedAt
          ? new Date(sa.award.updatedAt)
          : new Date(),
      })) || undefined,
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
  };
};

export const toSpell = (s: SpellWithSchool): Spell => {
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
    reaction: s.reaction ?? false,
    target,
    damage: s.damage || undefined,
    description: s.description || undefined,
    highLevels: s.highLevels || undefined,
    concentration: s.concentration || undefined,
    upcast: s.upcast || undefined,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
    school: s.school
      ? {
          id: s.school.id,
          name: s.school.name,
          description: s.school.description || undefined,
          visibility: s.school.visibility as SpellSchool["visibility"],
          spells: [],
          creator: toUser(s.school.creator),
          createdAt: s.school.createdAt
            ? new Date(s.school.createdAt)
            : new Date(),
          updatedAt: s.school.updatedAt
            ? new Date(s.school.updatedAt)
            : new Date(),
        }
      : undefined,
  };
};
