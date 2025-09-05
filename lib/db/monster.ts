import {
  invalidateEntityImageCache,
  preloadImage,
} from "@/lib/cache/image-cache";
import type {
  Ability,
  Action,
  Family,
  Monster,
  MonsterArmor,
  MonsterMini,
  MonsterSize,
} from "@/lib/types";
import { getBaseUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import type { InputJsonValue } from "../prisma/runtime/library";
import { toMonster } from "./converters";
import { prisma, toMonsterMini } from "./index";
import {
  extractAllConditions,
  syncMonsterConditions,
} from "./monster-conditions";

const stripActionIds = (actions: Action[]): Omit<Action, "id">[] =>
  actions.map(({ id, ...action }) => action);

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

export const listPublicMonsterMinis = async (): Promise<MonsterMini[]> => {
  return (
    await prisma.monster.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
    })
  ).map(toMonsterMini);
};

export const findMonster = async (id: string): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const monster = await prisma.monster.findUnique({
    where: { id },
    include: {
      family: { include: { creator: true } },
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
      family: { include: { creator: true } },
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
      family: { include: { creator: true } },
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
        family: { include: { creator: true } },
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
        family: { include: { creator: true } },
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
  if (!isValidUUID(familyId)) {
    return [];
  }

  return (
    await prisma.monster.findMany({
      include: {
        family: { include: { creator: true } },
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
  minion?: boolean;
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
    minion = false,
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
      actions: stripActionIds(actions) as unknown as InputJsonValue[],
      abilities: abilities as unknown as InputJsonValue[],
      bloodied: legendary ? bloodied : "",
      lastStand: legendary ? lastStand : "",
      saves: savesArray,
      visibility,
      actionPreface,
      moreInfo,
      legendary,
      minion,
      creator: {
        connect: { id: user.id },
      },
    },
    include: {
      family: { include: { creator: true } },
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

  const monster = toMonster(createdMonster);

  // Trigger async image pre-generation (non-blocking)
  // Silent fail - image will be generated on-demand if needed
  preloadImage("monster", monster.id, getBaseUrl()).catch(() => {});

  return monster;
};

export interface UpdateMonsterInput {
  id: string;
  name: string;
  level: string;
  hp: number;
  armor: MonsterArmor;
  size: MonsterSize;
  speed: number;
  fly?: number;
  swim?: number;
  climb?: number;
  teleport?: number;
  burrow?: number;
  actions: Action[];
  abilities: Ability[];
  legendary: boolean;
  minion: boolean;
  bloodied: string;
  lastStand: string;
  saves: string[];
  kind: string;
  visibility: "public" | "private";
  actionPreface: string;
  moreInfo: string;
  family?: { id: string } | null;
  discordId: string;
}

export const updateMonster = async (
  input: UpdateMonsterInput
): Promise<Monster> => {
  const {
    id,
    name,
    level,
    hp,
    armor,
    size,
    speed,
    fly,
    swim,
    climb,
    teleport,
    burrow,
    actions,
    abilities,
    legendary,
    minion,
    bloodied,
    lastStand,
    saves,
    kind,
    visibility,
    actionPreface,
    moreInfo,
    family,
    discordId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid monster ID");
  }

  const updatedMonster = await prisma.monster.update({
    where: { id, creator: { discordId } },
    data: {
      name,
      level,
      hp,
      armor: armor === "none" || !armor ? "EMPTY_ENUM_VALUE" : armor,
      size,
      speed,
      fly,
      swim,
      climb,
      teleport,
      burrow,
      actions: stripActionIds(actions) as unknown as InputJsonValue[],
      abilities: abilities as unknown as InputJsonValue[],
      legendary,
      minion,
      bloodied,
      lastStand,
      saves: Array.isArray(saves) ? saves : saves ? [saves] : [],
      kind,
      visibility,
      actionPreface,
      moreInfo,
      family_id: family?.id || null,
      updatedAt: new Date(),
    },
    include: {
      family: { include: { creator: true } },
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });

  const conditionNames = extractAllConditions({
    actions: actions || [],
    abilities: abilities || [],
    bloodied: bloodied || "",
    lastStand: lastStand || "",
    moreInfo: moreInfo || "",
  });

  await syncMonsterConditions(id, conditionNames);

  const monster = toMonster(updatedMonster);

  // Invalidate old cached image and trigger async pre-generation
  // Silent fail - image will be generated on-demand if needed
  invalidateEntityImageCache("monster", monster.id);
  preloadImage("monster", monster.id, getBaseUrl()).catch(() => {});

  return monster;
};
