import type {
  Ability,
  Action,
  Monster,
  MonsterSize,
  MonsterArmor,
  Family,
} from "@/lib/types";
import { prisma } from "./index";
import { toMonster } from "./converters";
import type { InputJsonValue } from "../prisma/runtime/library";
import { isValidUUID } from "@/lib/utils/validation";

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
      include: { family: true, creator: true },
    })
  ).map(toMonster);
};

export const findPublicMonsterById = async (
  id: string,
): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const monster = await prisma.monster.findUnique({
    where: { id },
    include: { family: true, creator: true },
  });
  return monster ? toMonster(monster) : null;
};

export const listPublicMonstersForDiscordID = async (
  username: string,
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: { family: true, creator: true },
      where: {
        creator: { username },
        visibility: "public",
      },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export const listAllMonstersForDiscordID = async (
  id: string,
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: { family: true, creator: true },
      where: { creator: { discordId: id } },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export interface CreateMonsterInput {
  name: string;
  kind?: string;
  level: string;
  hp: number;
  armor: MonsterArmor;
  size: MonsterSize;
  speed: number;
  fly: number;
  swim: number;
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
  input: CreateMonsterInput,
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
      armor: armor || "EMPTY_ENUM_VALUE",
      size,
      speed: legendary ? 0 : speed,
      fly: legendary ? 0 : fly,
      swim: legendary ? 0 : swim,
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
    },
  });

  return toMonster(createdMonster);
};
