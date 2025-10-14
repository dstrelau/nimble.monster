import type { prisma } from "@/lib/db";
import { toFamilyOverview, toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import type { Ability, Action, FamilyOverview } from "@/lib/types";
import { uuidToIdentifier } from "@/lib/utils/slug";
import type { Monster, MonsterMini } from "./types";

export const toMonsterMini = (
  m: Prisma.Result<typeof prisma.monster, object, "findMany">[0]
): MonsterMini => ({
  id: m.id,
  hp: m.hp,
  legendary: m.legendary || false,
  minion: m.minion,
  level: m.level,
  levelInt: m.levelInt,
  name: m.name,
  visibility: m.visibility,
  size: m.size,
  armor: m.armor === "EMPTY_ENUM_VALUE" ? "none" : m.armor,
  createdAt: m.createdAt,
});

export const toMonster = (
  m: Prisma.Result<
    typeof prisma.monster,
    {
      include: {
        monsterFamilies: {
          include: { family: { include: { creator: true } } };
        };
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
    families: m.monsterFamilies
      .map((mf) => toFamilyOverview(mf.family))
      .filter((f): f is FamilyOverview => f !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name)),
    creator: toUser(m.creator),
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
