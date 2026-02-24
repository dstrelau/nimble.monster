import { and, asc, desc, eq, gt, inArray, like, lt, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { classAbilityItems, classAbilityLists, users } from "@/lib/db/schema";
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

  const db = getDatabase();

  const isDesc = sort.startsWith("-");
  const sortField = isDesc ? sort.slice(1) : sort;

  const conditions: ReturnType<typeof eq>[] = [];

  if (creatorId) {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, creatorId))
      .limit(1);

    if (userResult.length > 0) {
      conditions.push(eq(classAbilityLists.userId, userResult[0].id));
    }
  }

  if (characterClass) {
    conditions.push(eq(classAbilityLists.characterClass, characterClass));
  }

  if (search) {
    const searchCondition = or(
      like(classAbilityLists.name, `%${search}%`),
      like(classAbilityLists.description, `%${search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (cursorData) {
    const op = isDesc ? lt : gt;
    if (sortField === "name") {
      const cursorCondition = or(
        op(classAbilityLists.name, cursorData.value as string),
        and(
          eq(classAbilityLists.name, cursorData.value as string),
          gt(classAbilityLists.id, cursorData.id)
        )
      );
      if (cursorCondition) conditions.push(cursorCondition);
    } else if (sortField === "createdAt") {
      const cursorCondition = or(
        op(classAbilityLists.createdAt, cursorData.value as string),
        and(
          eq(classAbilityLists.createdAt, cursorData.value as string),
          gt(classAbilityLists.id, cursorData.id)
        )
      );
      if (cursorCondition) conditions.push(cursorCondition);
    }
  }

  const orderBy =
    sortField === "name"
      ? isDesc
        ? [desc(classAbilityLists.name), asc(classAbilityLists.id)]
        : [asc(classAbilityLists.name), asc(classAbilityLists.id)]
      : isDesc
        ? [desc(classAbilityLists.createdAt), asc(classAbilityLists.id)]
        : [asc(classAbilityLists.createdAt), asc(classAbilityLists.id)];

  const listRows = await db
    .select()
    .from(classAbilityLists)
    .innerJoin(users, eq(classAbilityLists.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasMore = listRows.length > limit;
  const results = hasMore ? listRows.slice(0, limit) : listRows;

  // Load items for all lists
  const listIds = results.map((r) => r.class_ability_lists.id);
  const itemsByList = new Map<
    string,
    (typeof classAbilityItems.$inferSelect)[]
  >();

  if (listIds.length > 0) {
    const itemRows = await db
      .select()
      .from(classAbilityItems)
      .where(inArray(classAbilityItems.classAbilityListId, listIds))
      .orderBy(asc(classAbilityItems.orderIndex));

    for (const item of itemRows) {
      const existing = itemsByList.get(item.classAbilityListId) || [];
      existing.push(item);
      itemsByList.set(item.classAbilityListId, existing);
    }
  }

  let nextCursor: string | null = null;
  if (hasMore && results.length > 0) {
    const lastList = results[results.length - 1].class_ability_lists;
    let cursorDataOut: CursorData;

    if (sortField === "name") {
      cursorDataOut = {
        sort: sort as "name" | "-name",
        value: lastList.name,
        id: lastList.id,
      };
    } else {
      cursorDataOut = {
        sort: sort as "createdAt" | "-createdAt",
        value: lastList.createdAt ?? "",
        id: lastList.id,
      };
    }

    nextCursor = encodeCursor(cursorDataOut);
  }

  return {
    data: results.map((r) =>
      toClassAbilityList(
        r.class_ability_lists,
        r.users,
        itemsByList.get(r.class_ability_lists.id) || []
      )
    ),
    nextCursor,
  };
};
