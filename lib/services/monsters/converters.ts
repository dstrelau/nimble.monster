import { toFamilyOverview, toUser } from "@/lib/db/converters";
import { getPaperforgeEntry } from "@/lib/paperforge-catalog";
import type { Ability, Action, FamilyOverview } from "@/lib/types";
import { uuidToIdentifier } from "@/lib/utils/slug";
import { parseSaves } from "./saves";
import type { Monster, MonsterMini } from "./types";

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

interface MonsterRow {
  id: string;
  name: string;
  hp: number;
  legendary: boolean | null;
  minion: boolean;
  level: string;
  levelInt: number;
  visibility: string | null;
  size: string;
  armor: string;
  paperforgeId: string | null;
  createdAt: string | null;
  kind: string;
  role: string | null;
  bloodied: string;
  lastStand: string;
  speed: number;
  fly: number;
  swim: number;
  climb: number;
  teleport: number;
  burrow: number;
  saves: string;
  updatedAt: string | null;
  abilities: unknown;
  actions: unknown;
  actionPreface: string | null;
  moreInfo: string | null;
  remixedFromId: string | null;
  isOfficial: boolean | null;
}

interface UserRow {
  id: string;
  discordId: string | null;
  username: string | null;
  displayName: string | null;
  imageUrl: string | null;
  avatar: string | null;
}

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

interface FamilyRow {
  id: string;
  name: string;
  description: string | null;
  abilities: unknown;
  visibility: string | null;
  creatorId: string;
  creator: UserRow;
}

interface MonsterWithRelations extends MonsterRow {
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
  monsterFamilies: Array<{ family: FamilyRow }>;
  monsterAwards?: Array<{ award: AwardRow }>;
  remixedFrom?: {
    id: string;
    name: string;
    creator: UserRow;
  } | null;
}

export const toMonsterMini = (m: MonsterRow): MonsterMini => ({
  id: m.id,
  hp: m.hp,
  legendary: m.legendary || false,
  minion: m.minion,
  level: m.level,
  levelInt: m.levelInt,
  name: m.name,
  visibility: (m.visibility ?? "public") as MonsterMini["visibility"],
  size: m.size as MonsterMini["size"],
  armor: (m.armor === "" || m.armor === "EMPTY_ENUM_VALUE"
    ? "none"
    : m.armor) as MonsterMini["armor"],
  paperforgeId: m.paperforgeId ?? undefined,
  createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
  role: m.role as MonsterMini["role"],
  isOfficial: m.isOfficial ?? false,
});

export const toMonster = (m: MonsterWithRelations): Monster => {
  return {
    ...toMonsterMini(m),
    kind: m.kind,
    role: m.role as Monster["role"],
    bloodied: m.bloodied,
    lastStand: m.lastStand,
    speed: m.speed,
    fly: m.fly,
    swim: m.swim,
    climb: m.climb,
    teleport: m.teleport,
    burrow: m.burrow,
    saves: m.saves,
    updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
    abilities: parseJsonField<Omit<Ability, "id">>(m.abilities).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    actions: parseJsonField<Omit<Action, "id">>(m.actions).map((action) => ({
      ...action,
      id: crypto.randomUUID(),
    })),
    actionPreface: m.actionPreface || "",
    moreInfo: m.moreInfo || "",
    families: m.monsterFamilies
      .map((mf) => toFamilyOverview(mf.family))
      .filter((f): f is FamilyOverview => f !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name)),
    creator: toUser(m.creator),
    source: m.source
      ? {
          ...m.source,
          createdAt: m.source.createdAt
            ? new Date(m.source.createdAt)
            : new Date(),
          updatedAt: m.source.updatedAt
            ? new Date(m.source.updatedAt)
            : new Date(),
        }
      : undefined,
    awards:
      m.monsterAwards?.map((ma) => ({
        id: ma.award.id,
        slug: ma.award.slug,
        name: ma.award.name,
        abbreviation: ma.award.abbreviation,
        description: ma.award.description,
        url: ma.award.url,
        color: ma.award.color,
        icon: ma.award.icon,
        createdAt: ma.award.createdAt
          ? new Date(ma.award.createdAt)
          : new Date(),
        updatedAt: ma.award.updatedAt
          ? new Date(ma.award.updatedAt)
          : new Date(),
      })) || undefined,
    remixedFromId: m.remixedFromId || null,
    remixedFrom: m.remixedFrom
      ? {
          id: m.remixedFrom.id,
          name: m.remixedFrom.name,
          creator: toUser(m.remixedFrom.creator),
        }
      : null,
  };
};

export const toZodMonster = (m: Monster) => {
  const movement = [];
  if (m.speed > 0) movement.push({ speed: m.speed });
  if (m.fly > 0) movement.push({ mode: "fly", speed: m.fly });
  if (m.swim > 0) movement.push({ mode: "swim", speed: m.swim });
  if (m.climb > 0) movement.push({ mode: "climb", speed: m.climb });
  if (m.burrow > 0) movement.push({ mode: "burrow", speed: m.burrow });
  if (m.teleport > 0) movement.push({ mode: "teleport", speed: m.teleport });

  const abilities = m.abilities.map((a) => ({
    description: a.description,
    name: a.name,
  }));

  const actions = m.actions.map((a) => {
    const action: {
      name: string;
      description?: string;
      damage?: { roll: string };
      target?: { reach: number } | { range: number };
    } = {
      name: a.name,
      description: [a.damage, a.description].filter(Boolean).join(". "),
    };

    if (a.damage) {
      action.damage = { roll: a.damage };
    }

    const reachMatch = a.description?.match(/\(reach\s+(\d+)\)/i);
    const rangeMatch = a.description?.match(/\(range\s+(\d+)\)/i);

    if (reachMatch) {
      action.target = { reach: Number.parseInt(reachMatch[1], 10) };
    } else if (rangeMatch) {
      action.target = { range: Number.parseInt(rangeMatch[1], 10) };
    }

    return action;
  });

  const parsedLevel: number | "1/4" | "1/3" | "1/2" =
    m.level === "1/4" || m.level === "1/3" || m.level === "1/2"
      ? m.level
      : Number.parseInt(m.level, 10);

  let paperforgeImageUrl: string | undefined;
  if (m.paperforgeId) {
    const entry = getPaperforgeEntry(m.paperforgeId);
    if (entry) {
      paperforgeImageUrl = `/paperforge/${entry.folder}/portrait.png`;
    }
  }

  const base = {
    id: uuidToIdentifier(m.id),
    name: m.name,
    hp: m.hp,
    level: parsedLevel,
    size: m.size,
    armor: m.armor === "none" ? ("none" as const) : m.armor,
    kind: m.kind || undefined,
    movement: movement,
    abilities,
    actions,
    actionsInstructions: m.actionPreface,
    effects: [],
    description: m.moreInfo,
    paperforgeId: m.paperforgeId || undefined,
    paperforgeImageUrl,
  };

  if (m.legendary) {
    return {
      ...base,
      legendary: true as const,
      bloodied: {
        description: m.bloodied,
      },
      lastStand: {
        description: m.lastStand,
      },
      saves: parseSaves(m.saves),
    };
  }

  return {
    ...base,
    legendary: false as const,
  };
};

export const toJsonApiMonster = (m: Monster) => {
  const monsterData = toZodMonster(m);
  const { id, ...attributes } = monsterData;

  return {
    type: "monsters",
    id,
    attributes,
    links: {
      self: `/api/monsters/${id}`,
    },
  };
};
