import { prisma } from "@/lib/db";
import { toCompanion } from "@/lib/db/converters";
import type { Prisma } from "@/lib/prisma";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import type {
  PaginateCompanionsSortOption,
  PaginateMonstersParams,
  PaginatePublicCompanionsResponse,
} from "./types";

export const paginatePublicCompanions = async ({
  cursor,
  limit = 6,
  sort = "-createdAt",
  search,
  class: companionClass = "all",
  creatorId,
}: PaginateMonstersParams): Promise<PaginatePublicCompanionsResponse> => {
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

  const where: Prisma.CompanionWhereInput = { visibility: "public" };

  if (creatorId) {
    where.userId = creatorId;
  }

  if (companionClass !== "all") {
    where.class = { contains: companionClass, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { kind: { contains: search, mode: "insensitive" } },
      { class: { contains: search, mode: "insensitive" } },
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

  const companions = await prisma.companion.findMany({
    where,
    include: {
      creator: true,
      source: true,
      companionAwards: { include: { award: true } },
    },
    orderBy,
    take: limit + 1,
  });

  const hasMore = companions.length > limit;
  const results = hasMore ? companions.slice(0, limit) : companions;

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastCompanion = results[results.length - 1];
    let cursorData: CursorData;

    if (sortField === "name") {
      cursorData = {
        sort: sort as PaginateCompanionsSortOption,
        value: lastCompanion.name,
        id: lastCompanion.id,
      };
    } else {
      cursorData = {
        sort: sort as PaginateCompanionsSortOption,
        value: lastCompanion.createdAt.toISOString(),
        id: lastCompanion.id,
      };
    }

    nextCursor = encodeCursor(cursorData);
  }

  return {
    data: results.map(toCompanion),
    nextCursor,
  };
};
