"use server";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/prisma";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import { toAncestry, toAncestryMini } from "./converters";
import type { PaginateAncestriesParams } from "./service";
import type {
  Ancestry,
  AncestryMini,
  CreateAncestryInput,
  SearchAncestriesParams,
  UpdateAncestryInput,
} from "./types";

export const deleteAncestry = async (
  id: string,
  discordId: string
): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const ancestry = await prisma.ancestry.delete({
    where: {
      id: id,
      creator: { discordId },
    },
  });

  return !!ancestry;
};

export const listPublicAncestries = async (): Promise<AncestryMini[]> => {
  return (
    await prisma.ancestry.findMany({
      orderBy: { name: "asc" },
    })
  ).map(toAncestryMini);
};

export const paginatePublicAncestries = async ({
  cursor,
  limit = 100,
  sort = "-createdAt",
  search,
  creatorId,
  sourceId,
}: PaginateAncestriesParams): Promise<{
  data: Ancestry[];
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

  const where: Prisma.AncestryWhereInput = {};

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

  const ancestries = await prisma.ancestry.findMany({
    where,
    include: {
      creator: true,
      source: true,
      ancestryAwards: { include: { award: true } },
    },
    orderBy,
    take: limit + 1,
  });

  const hasMore = ancestries.length > limit;
  const results = hasMore ? ancestries.slice(0, limit) : ancestries;

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastAncestry = results[results.length - 1];
    let cursorData: CursorData;

    if (sortField === "name") {
      cursorData = {
        sort: sort as "name" | "-name",
        value: lastAncestry.name,
        id: lastAncestry.id,
      };
    } else {
      cursorData = {
        sort: sort as "createdAt" | "-createdAt",
        value: lastAncestry.createdAt.toISOString(),
        id: lastAncestry.id,
      };
    }

    nextCursor = encodeCursor(cursorData);
  }

  return {
    data: results.map(toAncestry),
    nextCursor,
  };
};

export const findAncestry = async (id: string): Promise<Ancestry | null> => {
  const ancestry = await prisma.ancestry.findUnique({
    where: { id },
    include: {
      creator: true,
      source: true,
      ancestryAwards: { include: { award: true } },
    },
  });
  return ancestry ? toAncestry(ancestry) : null;
};

export const findAncestryWithCreatorId = async (
  id: string,
  creatorId: string
): Promise<Ancestry | null> => {
  const ancestry = await prisma.ancestry.findUnique({
    where: { id, creator: { id: creatorId } },
    include: {
      creator: true,
      source: true,
      ancestryAwards: { include: { award: true } },
    },
  });
  return ancestry ? toAncestry(ancestry) : null;
};

export const listAllAncestriesForDiscordID = async (
  discordId: string
): Promise<Ancestry[]> => {
  return (
    await prisma.ancestry.findMany({
      include: {
        creator: true,
        source: true,
        ancestryAwards: { include: { award: true } },
      },
      where: { creator: { discordId } },
      orderBy: { name: "asc" },
    })
  ).map(toAncestry);
};

export const searchPublicAncestries = async ({
  searchTerm,
  sourceId,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchAncestriesParams & { offset?: number }): Promise<Ancestry[]> => {
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
    await prisma.ancestry.findMany({
      where: whereClause,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        creator: true,
        source: true,
        ancestryAwards: { include: { award: true } },
      },
    })
  ).map(toAncestry);
};

export const createAncestry = async (
  input: CreateAncestryInput,
  discordId: string
): Promise<Ancestry> => {
  const { name, description, size, rarity, abilities, sourceId } = input;

  const user = await prisma.user.findUnique({
    where: { discordId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const createdAncestry = await prisma.ancestry.create({
    data: {
      name,
      description,
      size,
      rarity,
      abilities: abilities as never[],
      creator: {
        connect: { id: user.id },
      },
      ...(sourceId && { source: { connect: { id: sourceId } } }),
    },
    include: {
      creator: true,
      source: true,
      ancestryAwards: { include: { award: true } },
    },
  });

  return toAncestry(createdAncestry);
};

export const updateAncestry = async (
  id: string,
  input: UpdateAncestryInput,
  discordId: string
): Promise<Ancestry> => {
  const { name, description, size, rarity, abilities, sourceId } = input;

  if (!isValidUUID(id)) {
    throw new Error("Invalid ancestry ID");
  }

  const updatedAncestry = await prisma.ancestry.update({
    where: {
      id,
      creator: { discordId },
    },
    data: {
      name,
      description,
      size,
      rarity,
      abilities: abilities as never[],
      source: sourceId ? { connect: { id: sourceId } } : { disconnect: true },
    },
    include: {
      creator: true,
      source: true,
      ancestryAwards: { include: { award: true } },
    },
  });

  return toAncestry(updatedAncestry);
};
