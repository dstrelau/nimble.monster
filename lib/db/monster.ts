import type {
  Monster,
  MonsterArmor,
  MonsterMini,
  MonsterSize,
  TypeFilter,
} from "@/lib/services/monsters";
import type { Ability, Action, Family } from "@/lib/types";

import { isValidUUID } from "@/lib/utils/validation";
import type { InputJsonValue } from "../prisma/runtime/library";
import { toMonster, toMonsterMini } from "../services/monsters/converters";
import { syncMonsterFamilies } from "../services/monsters/families";
import { toUser } from "./converters";
import { prisma } from "./index";
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
  const monster = await prisma.monster.findUnique({
    where: { id },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const findPublicMonsterById = async (
  id: string
): Promise<Monster | null> => {
  const monster = await prisma.monster.findUnique({
    where: { id, visibility: "public" },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const findMonsterWithCreatorId = async (
  id: string,
  creatorId: string
): Promise<Monster | null> => {
  const monster = await prisma.monster.findUnique({
    where: { id, creator: { id: creatorId } },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const listPublicMonstersForUser = async (
  userId: string
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: {
        monsterFamilies: {
          include: { family: { include: { creator: true } } },
        },
        creator: true,
        monsterConditions: { include: { condition: true } },
      },
      where: {
        userId,
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
        monsterFamilies: {
          include: { family: { include: { creator: true } } },
        },
        creator: true,
        monsterConditions: { include: { condition: true } },
      },
      where: { creator: { discordId: id } },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

export interface SearchMonstersParams {
  searchTerm?: string;
  type?: TypeFilter;
  creatorId?: string;
  legendary?: boolean | null;
  sortBy?: "name" | "level" | "hp";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const searchPublicMonsterMinis = async ({
  searchTerm,
  type,
  creatorId,
  sortBy = "name",
  sortDirection = "asc",
  limit = 500,
}: SearchMonstersParams): Promise<MonsterMini[]> => {
  const whereClause: {
    creator?: { discordId?: string };
    visibility: "public";
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      kind?: { contains: string; mode: "insensitive" };
    }>;
    legendary?: boolean;
    minion?: boolean;
  } = {
    visibility: "public",
  };
  if (creatorId) {
    whereClause.creator = { discordId: creatorId };
  }

  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { kind: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  switch (type) {
    case "all":
      break;
    case "standard":
      whereClause.legendary = false;
      whereClause.minion = false;
      break;
    case "legendary":
      whereClause.legendary = true;
      break;
    case "minion":
      whereClause.minion = true;
      break;
  }

  let orderBy:
    | { name: "asc" | "desc" }
    | { levelInt: "asc" | "desc" }
    | { hp: "asc" | "desc" } = { name: "asc" };

  if (sortBy === "name") {
    orderBy = { name: sortDirection };
  } else if (sortBy === "level") {
    orderBy = { levelInt: sortDirection };
  } else if (sortBy === "hp") {
    orderBy = { hp: sortDirection };
  }

  return (
    await prisma.monster.findMany({
      where: whereClause,
      orderBy,
      take: limit,
    })
  ).map(toMonsterMini);
};

export const listMonstersByFamilyId = async (
  familyId: string
): Promise<Monster[]> => {
  return (
    await prisma.monster.findMany({
      include: {
        monsterFamilies: {
          include: { family: { include: { creator: true } } },
        },
        creator: true,
        monsterConditions: { include: { condition: true } },
      },
      where: {
        monsterFamilies: { some: { familyId } },
        visibility: "public",
      },
      orderBy: { levelInt: "asc" },
    })
  ).map(toMonster);
};

export interface CreateMonsterInput {
  name: string;
  kind?: string;
  level: string;
  levelInt: number;
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
    levelInt,
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
      levelInt,
      hp,
      armor: armor === "none" || armor === "" ? "EMPTY_ENUM_VALUE" : armor,
      size,
      speed: legendary ? 0 : speed,
      fly: legendary ? 0 : fly,
      swim: legendary ? 0 : swim,
      climb: legendary ? 0 : climb,
      burrow: legendary ? 0 : burrow,
      teleport: legendary ? 0 : teleport,
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
      monsterFamilies: { include: { family: { include: { creator: true } } } },
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

  if (family) {
    await syncMonsterFamilies(createdMonster.id, [family.id]);
  }

  // Re-fetch to get synced families
  const finalMonster = await prisma.monster.findUnique({
    where: { id: createdMonster.id },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });

  if (!finalMonster) {
    throw new Error("Failed to fetch created monster");
  }

  return toMonster(finalMonster);
};

export interface UpdateMonsterInput {
  id: string;
  name: string;
  level: string;
  levelInt: number;
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
  families?: { id: string }[];
  discordId: string;
}

export const findMonsterCollections = async (monsterId: string) => {
  if (!isValidUUID(monsterId)) return [];

  const collections = await prisma.collection.findMany({
    where: {
      monsterCollections: {
        some: { monsterId },
      },
      visibility: "public",
    },
    include: {
      creator: true,
    },
    orderBy: { name: "asc" },
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    creator: toUser(collection.creator),
  }));
};

export const updateMonster = async (
  input: UpdateMonsterInput
): Promise<Monster> => {
  const {
    id,
    name,
    level,
    levelInt,
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
    families,
    discordId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid monster ID");
  }

  const _updatedMonster = await prisma.monster.update({
    where: { id, creator: { discordId } },
    data: {
      name,
      level,
      levelInt,
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
      updatedAt: new Date(),
    },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
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

  if (families !== undefined) {
    await syncMonsterFamilies(
      id,
      families.map((f) => f.id)
    );
  }

  // Re-fetch to get synced families
  const finalMonster = await prisma.monster.findUnique({
    where: { id },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      monsterConditions: { include: { condition: true } },
    },
  });

  if (!finalMonster) {
    throw new Error("Failed to fetch updated monster");
  }

  // invalidateEntityImageCache("monster", finalMonster.id);
  return toMonster(finalMonster);
};
