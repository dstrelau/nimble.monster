import type {
  Ability,
  Action,
  Family,
  Monster,
  MonsterArmor,
  MonsterSize,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import type { InputJsonValue } from "../prisma/runtime/library";
import { toMonster } from "./converters";
import { prisma } from "./index";
import {
  extractAllConditions,
  syncMonsterConditions,
} from "./monster-conditions";

export const deleteMonster = async ({
  id,
  discordId,
}: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const monster = await prisma.monster.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!monster;
};

export const listPublicMonsters = async (): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
      include: {
        family: true,
        creator: true,
        monsterConditions: { include: { condition: true } },
      },
    })
  ).map(toMonster);
};

export const findMonster = async (id: string): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const monster = await prisma.monster.findUnique({
    where: { id },
    include: {
      family: true,
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const findPublicMonsterById = async (
  id: string
): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const monster = await prisma.monster.findUnique({
    where: { id, visibility: "public" },
    include: {
      family: true,
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const findMonsterWithCreatorDiscordId = async (
  id: string,
  creatorId: string
): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const monster = await prisma.monster.findUnique({
    where: { id, creator: { discordId: creatorId } },
    include: {
      family: true,
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const listPublicMonstersForDiscordID = async (
  username: string
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: {
        family: true,
        creator: true,
        monsterConditions: { include: { condition: true } },
      },
      where: {
        creator: { username },
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export const listAllMonstersForDiscordID = async (
  id: string
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: {
        family: true,
        creator: true,
        monsterConditions: { include: { condition: true } },
      },
      where: { creator: { discordId: id } },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export const listMonstersByFamilyId = async (
  familyId: string
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: {
        family: true,
        creator: true,
        monsterConditions: { include: { condition: true } },
      },
      where: {
        family_id: familyId,
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export interface CreateMonsterInput {
  name: string;
  kind?: string;
  level: string;
  hp: number;
  armor: MonsterArmor | "";
  size: MonsterSize;
  speed: number;
  fly: number;
  swim: number;
  climb: number;
  burrow: number;
  teleport: number;
  family?: Family;
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  moreInfo?: string;
  visibility: "public" | "private";
  discordId: string;
  legendary?: boolean;
  bloodied?: string;
  lastStand?: string;
  saves?: string[];
}

export const createMonster = async (
  input: CreateMonsterInput
): Promise<Monster> => {
  const {
    name,
    kind = "",
    level,
    hp,
    armor,
    size,
    speed,
    fly,
    swim,
    climb,
    burrow,
    teleport,
    family,
    actions,
    abilities,
    actionPreface = "",
    moreInfo = "",
    visibility,
    discordId,
    legendary = false,
    bloodied = "",
    lastStand = "",
    saves = [],
  } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const savesArray = legendary
    ? Array.isArray(saves)
      ? saves
      : [saves].filter(Boolean)
    : [];

  const createdMonster = await prisma.monster.create({
    data: {
      name,
      kind,
      level,
      hp,
      armor: armor === "none" || armor === "" ? "EMPTY_ENUM_VALUE" : armor,
      size,
      speed: legendary ? 0 : speed,
      fly: legendary ? 0 : fly,
      swim: legendary ? 0 : swim,
      climb: legendary ? 0 : climb,
      burrow: legendary ? 0 : burrow,
      teleport: legendary ? 0 : teleport,
      family: family ? { connect: { id: family.id } } : undefined,
      actions: actions as unknown as InputJsonValue[],
      abilities: abilities as unknown as InputJsonValue[],
      bloodied: legendary ? bloodied : "",
      lastStand: legendary ? lastStand : "",
      saves: savesArray,
      visibility,
      actionPreface,
      moreInfo,
      legendary,
      creator: {
        connect: { id: user.id },
      },
    },
    include: {
      family: true,
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });

  const conditionNames = extractAllConditions({
    actions,
    abilities,
    bloodied: legendary ? bloodied : "",
    lastStand: legendary ? lastStand : "",
    moreInfo,
  });

  await syncMonsterConditions(createdMonster.id, conditionNames);

  return toMonster(createdMonster);
};
