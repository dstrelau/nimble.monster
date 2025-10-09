import type { prisma } from "@/lib/db";
import { toFamilyOverview, toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import type { Ability, Action } from "@/lib/types";
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
