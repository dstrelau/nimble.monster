"use server";

import { and, asc, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { families, type UserRow, users } from "@/lib/db/schema";
import type { Ability, User } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import type { FamilyOverview } from "./types";

const toUserFromRow = (u: UserRow): User => ({
  id: u.id,
  discordId: u.discordId ?? "",
  username: u.username ?? "",
  displayName: u.displayName || u.username || "",
  imageUrl:
    u.imageUrl ||
    (u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png"),
});

const toAbilitiesFromRow = (abilities: unknown): Ability[] => {
  return ((abilities as Omit<Ability, "id">[]) || []).map((ability) => ({
    ...ability,
    id: crypto.randomUUID(),
  }));
};

interface FamilyWithCreator {
  family: typeof families.$inferSelect;
  creator: UserRow;
}

const toFamilyOverviewFromRow = (data: FamilyWithCreator): FamilyOverview => ({
  id: data.family.id,
  name: data.family.name,
  description: data.family.description ?? undefined,
  abilities: toAbilitiesFromRow(data.family.abilities),
  visibility: data.family.visibility ?? null,
  creatorId: data.family.creatorId,
  creator: toUserFromRow(data.creator),
});

export interface PaginateFamiliesParams {
  cursor?: string;
  limit?: number;
  sort?: "name" | "-name" | "createdAt" | "-createdAt";
  search?: string;
}

function buildFamilyCursorCondition(
  sortField: string,
  isDesc: boolean,
  cursorData: CursorData
) {
  if (sortField === "name") {
    const cursorValue = cursorData.value as string;
    if (isDesc) {
      return or(
        lt(families.name, cursorValue),
        and(eq(families.name, cursorValue), gt(families.id, cursorData.id))
      );
    }
    return or(
      gt(families.name, cursorValue),
      and(eq(families.name, cursorValue), gt(families.id, cursorData.id))
    );
  }

  if (sortField === "createdAt") {
    const cursorValue = cursorData.value as string;
    if (isDesc) {
      return or(
        lt(families.createdAt, cursorValue),
        and(eq(families.createdAt, cursorValue), gt(families.id, cursorData.id))
      );
    }
    return or(
      gt(families.createdAt, cursorValue),
      and(eq(families.createdAt, cursorValue), gt(families.id, cursorData.id))
    );
  }

  return undefined;
}

export async function paginatePublicFamilies({
  cursor,
  limit = 100,
  sort = "name",
  search,
}: PaginateFamiliesParams): Promise<{
  data: FamilyOverview[];
  nextCursor: string | null;
}> {
  const db = await getDatabase();

  const cursorData = cursor ? decodeCursor(cursor) : null;

  if (cursorData && cursorData.sort !== sort) {
    throw new Error(
      `Cursor sort mismatch: cursor has '${cursorData.sort}' but request has '${sort}'`
    );
  }

  const isDesc = sort.startsWith("-");
  const sortField = isDesc ? sort.slice(1) : sort;

  // Build conditions array
  const whereConditions: ReturnType<typeof eq>[] = [
    eq(families.visibility, "public"),
  ];

  // Build the query
  let query = db
    .select({ family: families, creator: users })
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .$dynamic();

  // Add search condition
  if (search) {
    const searchCondition = like(families.name, `%${search}%`);
    query = query.where(and(...whereConditions, searchCondition));
  } else {
    query = query.where(and(...whereConditions));
  }

  // Add cursor pagination
  if (cursorData) {
    const cursorCondition = buildFamilyCursorCondition(
      sortField,
      isDesc,
      cursorData
    );
    if (cursorCondition) {
      const baseConditions = search
        ? [...whereConditions, like(families.name, `%${search}%`)]
        : whereConditions;

      query = db
        .select({ family: families, creator: users })
        .from(families)
        .innerJoin(users, eq(families.creatorId, users.id))
        .where(and(...baseConditions, cursorCondition))
        .$dynamic();
    }
  }

  // Add ordering
  if (sortField === "name") {
    query = query.orderBy(
      isDesc ? desc(families.name) : asc(families.name),
      asc(families.id)
    );
  } else {
    query = query.orderBy(
      isDesc ? desc(families.createdAt) : asc(families.createdAt),
      asc(families.id)
    );
  }

  // Execute with limit + 1 to check for more
  const rows = await query.limit(limit + 1);

  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  const results = resultRows.map(toFamilyOverviewFromRow);

  let nextCursor: string | null = null;
  if (hasMore && results.length > 0) {
    const lastFamily = results[results.length - 1];
    const lastRow = resultRows[resultRows.length - 1];
    let newCursorData: CursorData;

    if (sortField === "name") {
      newCursorData = {
        sort: sort as "name" | "-name",
        value: lastFamily.name,
        id: lastFamily.id,
      };
    } else {
      newCursorData = {
        sort: sort as "createdAt" | "-createdAt",
        value: lastRow.family.createdAt ?? new Date().toISOString(),
        id: lastFamily.id,
      };
    }

    nextCursor = encodeCursor(newCursorData);
  }

  return {
    data: results,
    nextCursor,
  };
}

export async function findPublicFamilyById(
  id: string
): Promise<FamilyOverview | null> {
  const db = await getDatabase();

  const rows = await db
    .select({ family: families, creator: users })
    .from(families)
    .innerJoin(users, eq(families.creatorId, users.id))
    .where(and(eq(families.id, id), eq(families.visibility, "public")))
    .limit(1);

  if (rows.length === 0) return null;

  return toFamilyOverviewFromRow(rows[0]);
}

export class FamiliesService {
  paginatePublicFamilies = paginatePublicFamilies;
  getPublicFamily = findPublicFamilyById;
}

export const familiesService = new FamiliesService();
