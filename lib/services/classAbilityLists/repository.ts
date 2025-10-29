"use server";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/lib/prisma";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { toClassAbilityList } from "./converters";
import type { PaginateClassAbilityListsParams } from "./service";
import type { ClassAbilityList } from "./types";

export const paginatePublicClassAbilityLists = async ({
  cursor,
  limit = 100,
  sort = "-createdAt",
  search,
  creatorId,
  characterClass,
}: PaginateClassAbilityListsParams): Promise<{
  data: ClassAbilityList[];
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

  const where: Prisma.ClassAbilityListWhereInput = {};

  if (creatorId) {
    where.creator = { id: creatorId };
  }

  if (characterClass) {
    where.characterClass = characterClass;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
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
    }
  }

  const lists = await prisma.classAbilityList.findMany({
    where,
    include: {
      creator: true,
      items: {
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy,
    take: limit + 1,
  });

  const hasMore = lists.length > limit;
  const results = hasMore ? lists.slice(0, limit) : lists;

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastList = results[results.length - 1];
    let cursorData: CursorData;

    if (sortField === "name") {
      cursorData = {
        sort: sort as "name" | "-name",
        value: lastList.name,
        id: lastList.id,
      };
    } else {
      cursorData = {
        sort: sort as "createdAt" | "-createdAt",
        value: lastList.createdAt.toISOString(),
        id: lastList.id,
      };
    }

    nextCursor = encodeCursor(cursorData);
  }

  return {
    data: results.map(toClassAbilityList),
    nextCursor,
  };
};
