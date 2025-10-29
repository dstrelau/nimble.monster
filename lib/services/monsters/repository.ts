import { prisma } from "@/lib/db";
import { toUser } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import type { InputJsonValue } from "@/lib/prisma/runtime/library";
import type { Action, Source } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import { extractAllConditions, syncMonsterConditions } from "./conditions";
import { toMonster, toMonsterMini } from "./converters";
import { syncMonsterFamilies } from "./families";
import type {
  CreateMonsterInput,
  Monster,
  MonsterMini,
  PaginateMonstersParams,
  SearchMonstersParams,
  UpdateMonsterInput,
} from "./types";

const stripActionIds = (actions: Action[]): Omit<Action, "id">[] =>
  actions.map(({ id, ...action }) => action);

export const deleteMonster = async (
  id: string,
  discordId: string
): Promise<boolean> => {
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

export const paginateMonsters = async ({
  cursor,
  limit = 100,
  sort = "-createdAt",
  search,
  type = "all",
  creatorId,
  sourceId,
  includePrivate = false,
}: PaginateMonstersParams & { includePrivate?: boolean }): Promise<{
  data: Monster[];
  nextCursor: string | null;
}> => {
  const cursorData = cursor ? decodeCursor(cursor) : null;

  if (cursorData && cursorData.sort !== sort) {
    throw new Error(
      `Cursor sort mismatch: cursor has '${cursorData.sort}' but request has '${sort}'`
    );
  }

  const isDesc = sort.startsWith("-");
  const sortField = isDesc ? sort.slice(1) : sort;
  const sortDir = isDesc ? "desc" : "asc";

  let orderBy:
    | [{ name: "asc" | "desc" }, { id: "asc" | "desc" }]
    | [{ createdAt: "asc" | "desc" }, { id: "asc" | "desc" }]
    | [{ levelInt: "asc" | "desc" }, { id: "asc" | "desc" }];

  if (sortField === "name") {
    orderBy = [{ name: sortDir }, { id: "asc" }];
  } else if (sortField === "createdAt") {
    orderBy = [{ createdAt: sortDir }, { id: "asc" }];
  } else {
    orderBy = [{ levelInt: sortDir }, { id: "asc" }];
  }
  const where: Prisma.MonsterWhereInput = includePrivate
    ? {}
    : { visibility: "public" };

  if (creatorId) {
    where.userId = creatorId;
  }

  if (sourceId) {
    where.sourceId = sourceId;
  }

  if (type === "legendary") {
    where.legendary = true;
  } else if (type === "minion") {
    where.minion = true;
  } else if (type === "standard") {
    where.minion = false;
    where.legendary = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { kind: { contains: search, mode: "insensitive" } },
    ];
  }

  if (cursorData) {
    const op = isDesc ? "lt" : "gt";

    if (sortField === "name") {
      where.OR = [
        { name: { [op]: cursorData.value as string } },
        {
          AND: [
            { name: cursorData.value as string },
            { id: { gt: cursorData.id } },
          ],
        },
      ];
    } else if (sortField === "createdAt") {
      const date = new Date(cursorData.value as string);
      where.OR = [
        { createdAt: { [op]: date } },
        { AND: [{ createdAt: date }, { id: { gt: cursorData.id } }] },
      ];
    } else if (sortField === "level") {
      where.OR = [
        { levelInt: { [op]: cursorData.value as number } },
        {
          AND: [
            { levelInt: cursorData.value as number },
            { id: { gt: cursorData.id } },
          ],
        },
      ];
    }
  }

  const monsters = await prisma.monster.findMany({
    where,
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      source: true,
      monsterConditions: { include: { condition: true } },
      monsterAwards: { include: { award: true } },
    },
    orderBy,
    take: limit + 1,
  });

  const hasMore = monsters.length > limit;
  const results = hasMore ? monsters.slice(0, limit) : monsters;

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastMonster = results[results.length - 1];
    let cursorData: CursorData;

    if (sortField === "name") {
      cursorData = {
        sort: sort as "name" | "-name",
        value: lastMonster.name,
        id: lastMonster.id,
      };
    } else if (sortField === "createdAt") {
      cursorData = {
        sort: sort as "createdAt" | "-createdAt",
        value: lastMonster.createdAt.toISOString(),
        id: lastMonster.id,
      };
    } else {
      cursorData = {
        sort: sort as "level" | "-level",
        value: lastMonster.levelInt,
        id: lastMonster.id,
      };
    }

    nextCursor = encodeCursor(cursorData);
  }

  return {
    data: results.map(toMonster),
    nextCursor,
  };
};

export const findMonster = async (id: string): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const monster = await prisma.monster.findUnique({
    where: { id },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      source: true,
      monsterConditions: { include: { condition: true } },
      monsterAwards: { include: { award: true } },
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
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      source: true,
      monsterConditions: { include: { condition: true } },
      monsterAwards: { include: { award: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const findMonsterWithCreatorId = async (
  id: string,
  creatorId: string
): Promise<Monster | null> => {
  if (!isValidUUID(id)) return null;

  const monster = await prisma.monster.findUnique({
    where: { id, creator: { id: creatorId } },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      source: true,
      monsterConditions: { include: { condition: true } },
      monsterAwards: { include: { award: true } },
    },
  });
  return monster ? toMonster(monster) : null;
};

export const countPublicMonstersForUser = async (
  userId: string
): Promise<number> => {
  return await prisma.monster.count({
    where: {
      userId,
      visibility: "public",
    },
  });
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
        source: true,
        monsterConditions: { include: { condition: true } },
        monsterAwards: { include: { award: true } },
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
        source: true,
        monsterConditions: { include: { condition: true } },
        monsterAwards: { include: { award: true } },
      },
      where: { creator: { discordId: id } },
      orderBy: { name: "asc" },
    })
  ).map(toMonster);
};

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
        source: true,
        monsterConditions: { include: { condition: true } },
        monsterAwards: { include: { award: true } },
      },
      where: {
        monsterFamilies: { some: { familyId } },
        visibility: "public",
      },
      orderBy: { levelInt: "asc" },
    })
  ).map(toMonster);
};

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

export const createMonster = async (
  input: CreateMonsterInput,
  discordId: string
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
    families = [],
    actions,
    abilities,
    actionPreface = "",
    moreInfo = "",
    visibility,
    legendary = false,
    minion = false,
    bloodied = "",
    lastStand = "",
    saves = [],
    sourceId,
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
      ...(sourceId && { source: { connect: { id: sourceId } } }),
    },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      source: true,
      monsterConditions: { include: { condition: true } },
      monsterAwards: { include: { award: true } },
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
  await syncMonsterFamilies(
    createdMonster.id,
    families.map((f) => f.id)
  );

  return toMonster(createdMonster);
};

export const updateMonster = async (
  input: UpdateMonsterInput,
  discordId: string
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
    families = [],
    sourceId,
  } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid monster ID");
  }

  const updatedMonster = await prisma.monster.update({
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
      ...(sourceId !== undefined &&
        sourceId !== null && {
          source: { connect: { id: sourceId } },
        }),
      ...(sourceId === null && {
        source: { disconnect: true },
      }),
    },
    include: {
      monsterFamilies: { include: { family: { include: { creator: true } } } },
      creator: true,
      source: true,
      monsterConditions: { include: { condition: true } },
      monsterAwards: { include: { award: true } },
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
  await syncMonsterFamilies(
    id,
    families.map((f) => f.id)
  );

  return toMonster(updatedMonster);
};

export const listAllSources = async (): Promise<Source[]> => {
  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
  });

  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    license: s.license,
    link: s.link,
    abbreviation: s.abbreviation,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
};
