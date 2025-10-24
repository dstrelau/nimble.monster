"use server";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/prisma";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import { toBackground, toBackgroundMini } from "./converters";
import type { PaginateBackgroundsParams } from "./service";
import type {
  Background,
  BackgroundMini,
  CreateBackgroundInput,
  SearchBackgroundsParams,
  UpdateBackgroundInput,
} from "./types";

export const deleteBackground = async (
  id: string,
  discordId: string
): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const background = await prisma.background.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!background;
};

export const listPublicBackgrounds = async (): Promise<BackgroundMini[]> => {
  return (
    await prisma.background.findMany({
      orderBy: { name: "asc" },
    })
  ).map(toBackgroundMini);
};

export const paginatePublicBackgrounds = async ({
  cursor,
  limit = 100,
  sort = "-createdAt",
  search,
  creatorId,
  sourceId,
}: PaginateBackgroundsParams): Promise<{
  data: Background[];
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
    | [{ createdAt: "asc" | "desc" }, { id: "asc" | "desc" }];

  if (sortField === "name") {
    orderBy = [{ name: sortDir }, { id: "asc" }];
  } else {
    orderBy = [{ createdAt: sortDir }, { id: "asc" }];
  }

  const where: Prisma.BackgroundWhereInput = {};

  if (creatorId) {
    where.creator = { id: creatorId };
  }

  if (sourceId) {
    where.sourceId = sourceId;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
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
    }
  }

  const backgrounds = await prisma.background.findMany({
    where,
    include: {
      creator: true,
      source: true,
      backgroundAwards: { include: { award: true } },
    },
    orderBy,
    take: limit + 1,
  });

  const hasMore = backgrounds.length > limit;
  const results = hasMore ? backgrounds.slice(0, limit) : backgrounds;

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastBackground = results[results.length - 1];
    let cursorData: CursorData;

    if (sortField === "name") {
      cursorData = {
        sort: sort as "name" | "-name",
        value: lastBackground.name,
        id: lastBackground.id,
      };
    } else {
      cursorData = {
        sort: sort as "createdAt" | "-createdAt",
        value: lastBackground.createdAt.toISOString(),
        id: lastBackground.id,
      };
    }

    nextCursor = encodeCursor(cursorData);
  }

  return {
    data: results.map(toBackground),
    nextCursor,
  };
};

export const findBackground = async (
  id: string
): Promise<Background | null> => {
  const background = await prisma.background.findUnique({
    where: { id },
    include: {
      creator: true,
      source: true,
      backgroundAwards: { include: { award: true } },
    },
  });
  return background ? toBackground(background) : null;
};

export const findBackgroundWithCreatorId = async (
  id: string,
  creatorId: string
): Promise<Background | null> => {
  const background = await prisma.background.findUnique({
    where: { id, creator: { id: creatorId } },
    include: {
      creator: true,
      source: true,
      backgroundAwards: { include: { award: true } },
    },
  });
  return background ? toBackground(background) : null;
};

export const listAllBackgroundsForDiscordID = async (
  discordId: string
): Promise<Background[]> => {
  return (
    await prisma.background.findMany({
      include: {
        creator: true,
        source: true,
        backgroundAwards: { include: { award: true } },
      },
      where: { creator: { discordId } },
      orderBy: { name: "asc" },
    })
  ).map(toBackground);
};

export const searchPublicBackgrounds = async ({
  searchTerm,
  sourceId,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchBackgroundsParams & { offset?: number }): Promise<Background[]> => {
  const whereClause: {
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
    }>;
    sourceId?: string;
  } = {};

  if (searchTerm) {
    whereClause.OR = [{ name: { contains: searchTerm, mode: "insensitive" } }];
  }

  if (sourceId) {
    whereClause.sourceId = sourceId;
  }

  let orderBy: { name: "asc" | "desc" } | { createdAt: "asc" | "desc" } = {
    createdAt: sortDirection,
  };

  if (sortBy === "name") {
    orderBy = { name: sortDirection };
  } else if (sortBy === "createdAt") {
    orderBy = { createdAt: sortDirection };
  }

  return (
    await prisma.background.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        creator: true,
        source: true,
        backgroundAwards: { include: { award: true } },
      },
    })
  ).map(toBackground);
};

export const createBackground = async (
  input: CreateBackgroundInput,
  discordId: string
): Promise<Background> => {
  const { name, description, requirement, sourceId } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdBackground = await prisma.background.create({
    data: {
      name,
      description,
      requirement,
      creator: {
        connect: { id: user.id },
      },
      ...(sourceId && { source: { connect: { id: sourceId } } }),
    },
    include: {
      creator: true,
      source: true,
      backgroundAwards: { include: { award: true } },
    },
  });

  return toBackground(createdBackground);
};

export const updateBackground = async (
  id: string,
  input: UpdateBackgroundInput,
  discordId: string
): Promise<Background> => {
  const { name, description, requirement, sourceId } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid background ID");
  }

  const updatedBackground = await prisma.background.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      description,
      requirement,
      source: sourceId ? { connect: { id: sourceId } } : { disconnect: true },
    },
    include: {
      creator: true,
      source: true,
      backgroundAwards: { include: { award: true } },
    },
  });

  return toBackground(updatedBackground);
};
