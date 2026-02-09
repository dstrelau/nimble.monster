"use server";
import { and, asc, desc, eq, gt, inArray, like, lt, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type AwardRow,
  awards,
  type BackgroundRow,
  backgrounds,
  backgroundsAwards,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "@/lib/db/schema";
import type { Source, User } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import type { PaginateBackgroundsParams } from "./service";
import type {
  Background,
  BackgroundMini,
  CreateBackgroundInput,
  SearchBackgroundsParams,
  UpdateBackgroundInput,
} from "./types";

// Helper converters
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

const toSourceFromRow = (s: SourceRow | null): Source | undefined => {
  if (!s) return undefined;
  return {
    id: s.id,
    name: s.name,
    license: s.license,
    link: s.link,
    abbreviation: s.abbreviation,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
  };
};

const toAwardFromRow = (a: AwardRow) => ({
  id: a.id,
  slug: a.slug,
  name: a.name,
  abbreviation: a.abbreviation,
  description: a.description,
  url: a.url,
  color: a.color,
  icon: a.icon,
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
});

const toBackgroundMiniFromRow = (b: BackgroundRow): BackgroundMini => ({
  id: b.id,
  name: b.name,
  requirement: b.requirement || undefined,
  createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
  updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
});

interface BackgroundFullData {
  background: BackgroundRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
}

const toBackgroundFromFullData = (data: BackgroundFullData): Background => ({
  id: data.background.id,
  name: data.background.name,
  requirement: data.background.requirement || undefined,
  createdAt: data.background.createdAt
    ? new Date(data.background.createdAt)
    : new Date(),
  updatedAt: data.background.updatedAt
    ? new Date(data.background.updatedAt)
    : new Date(),
  description: data.background.description,
  creator: toUserFromRow(data.creator),
  source: toSourceFromRow(data.source),
  awards: data.awards.map(toAwardFromRow),
});

async function loadBackgroundFullData(
  db: Awaited<ReturnType<typeof getDatabase>>,
  backgroundIds: string[]
): Promise<Map<string, BackgroundFullData>> {
  if (backgroundIds.length === 0) return new Map();

  const backgroundRows = await db
    .select()
    .from(backgrounds)
    .innerJoin(users, eq(backgrounds.userId, users.id))
    .leftJoin(sources, eq(backgrounds.sourceId, sources.id))
    .where(inArray(backgrounds.id, backgroundIds));

  const awardRows = await db
    .select({ backgroundId: backgroundsAwards.backgroundId, award: awards })
    .from(backgroundsAwards)
    .innerJoin(awards, eq(backgroundsAwards.awardId, awards.id))
    .where(inArray(backgroundsAwards.backgroundId, backgroundIds));

  const awardsByBackground = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByBackground.get(row.backgroundId) || [];
    existing.push(row.award);
    awardsByBackground.set(row.backgroundId, existing);
  }

  const result = new Map<string, BackgroundFullData>();
  for (const row of backgroundRows) {
    result.set(row.backgrounds.id, {
      background: row.backgrounds,
      creator: row.users,
      source: row.sources,
      awards: awardsByBackground.get(row.backgrounds.id) || [],
    });
  }

  return result;
}

export const deleteBackground = async (
  id: string,
  discordId: string
): Promise<boolean> => {
  if (!isValidUUID(id)) return false;

  const db = await getDatabase();

  // First find the user by discordId
  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(backgrounds)
    .where(
      and(eq(backgrounds.id, id), eq(backgrounds.userId, userResult[0].id))
    );

  return result.rowsAffected > 0;
};

export const listPublicBackgrounds = async (): Promise<BackgroundMini[]> => {
  const db = await getDatabase();

  const result = await db
    .select()
    .from(backgrounds)
    .orderBy(asc(backgrounds.name));

  return result.map(toBackgroundMiniFromRow);
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

  const db = await getDatabase();

  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (creatorId) {
    conditions.push(eq(backgrounds.userId, creatorId));
  }

  if (sourceId) {
    conditions.push(eq(backgrounds.sourceId, sourceId));
  }

  if (search) {
    conditions.push(like(backgrounds.name, `%${search}%`));
  }

  // Build cursor conditions
  let cursorConditions: ReturnType<typeof or> | undefined;
  if (cursorData) {
    const op = isDesc ? lt : gt;

    if (sortField === "name") {
      cursorConditions = or(
        op(backgrounds.name, cursorData.value as string),
        and(
          eq(backgrounds.name, cursorData.value as string),
          gt(backgrounds.id, cursorData.id)
        )
      );
    } else if (sortField === "createdAt") {
      cursorConditions = or(
        op(backgrounds.createdAt, cursorData.value as string),
        and(
          eq(backgrounds.createdAt, cursorData.value as string),
          gt(backgrounds.id, cursorData.id)
        )
      );
    }
  }

  const allConditions = [...conditions];
  if (cursorConditions) {
    allConditions.push(cursorConditions);
  }

  // Build order by
  const orderBy =
    sortField === "name"
      ? [
          isDesc ? desc(backgrounds.name) : asc(backgrounds.name),
          asc(backgrounds.id),
        ]
      : [
          isDesc ? desc(backgrounds.createdAt) : asc(backgrounds.createdAt),
          asc(backgrounds.id),
        ];

  // Query backgrounds
  const rows = await db
    .select()
    .from(backgrounds)
    .innerJoin(users, eq(backgrounds.userId, users.id))
    .leftJoin(sources, eq(backgrounds.sourceId, sources.id))
    .where(allConditions.length > 0 ? and(...allConditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  // Get background IDs for award lookup
  const backgroundIds = resultRows.map((r) => r.backgrounds.id);

  // Fetch awards
  const awardRows =
    backgroundIds.length > 0
      ? await db
          .select({
            backgroundId: backgroundsAwards.backgroundId,
            award: awards,
          })
          .from(backgroundsAwards)
          .innerJoin(awards, eq(backgroundsAwards.awardId, awards.id))
          .where(inArray(backgroundsAwards.backgroundId, backgroundIds))
      : [];

  const awardsByBackground = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByBackground.get(row.backgroundId) || [];
    existing.push(row.award);
    awardsByBackground.set(row.backgroundId, existing);
  }

  // Convert to Background objects
  const results = resultRows.map((row) => {
    const fullData: BackgroundFullData = {
      background: row.backgrounds,
      creator: row.users,
      source: row.sources,
      awards: awardsByBackground.get(row.backgrounds.id) || [],
    };
    return toBackgroundFromFullData(fullData);
  });

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && resultRows.length > 0) {
    const lastRow = resultRows[resultRows.length - 1];
    const cursorData: CursorData = {
      sort: sort as "name" | "-name" | "createdAt" | "-createdAt",
      value:
        sortField === "name"
          ? lastRow.backgrounds.name
          : (lastRow.backgrounds.createdAt ?? new Date().toISOString()),
      id: lastRow.backgrounds.id,
    };
    nextCursor = encodeCursor(cursorData);
  }

  return { data: results, nextCursor };
};

export const findBackground = async (
  id: string
): Promise<Background | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  const fullDataMap = await loadBackgroundFullData(db, [id]);
  const fullData = fullDataMap.get(id);

  return fullData ? toBackgroundFromFullData(fullData) : null;
};

export const findBackgroundWithCreatorId = async (
  id: string,
  creatorId: string
): Promise<Background | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  const result = await db
    .select()
    .from(backgrounds)
    .innerJoin(users, eq(backgrounds.userId, users.id))
    .leftJoin(sources, eq(backgrounds.sourceId, sources.id))
    .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, creatorId)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];

  // Fetch awards
  const awardRows = await db
    .select({ award: awards })
    .from(backgroundsAwards)
    .innerJoin(awards, eq(backgroundsAwards.awardId, awards.id))
    .where(eq(backgroundsAwards.backgroundId, id));

  const fullData: BackgroundFullData = {
    background: row.backgrounds,
    creator: row.users,
    source: row.sources,
    awards: awardRows.map((r) => r.award),
  };

  return toBackgroundFromFullData(fullData);
};

export const listAllBackgroundsForDiscordID = async (
  discordId: string
): Promise<Background[]> => {
  const db = await getDatabase();

  const rows = await db
    .select()
    .from(backgrounds)
    .innerJoin(users, eq(backgrounds.userId, users.id))
    .leftJoin(sources, eq(backgrounds.sourceId, sources.id))
    .where(eq(users.discordId, discordId))
    .orderBy(asc(backgrounds.name));

  if (rows.length === 0) return [];

  const backgroundIds = rows.map((r) => r.backgrounds.id);

  // Fetch awards
  const awardRows = await db
    .select({ backgroundId: backgroundsAwards.backgroundId, award: awards })
    .from(backgroundsAwards)
    .innerJoin(awards, eq(backgroundsAwards.awardId, awards.id))
    .where(inArray(backgroundsAwards.backgroundId, backgroundIds));

  const awardsByBackground = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByBackground.get(row.backgroundId) || [];
    existing.push(row.award);
    awardsByBackground.set(row.backgroundId, existing);
  }

  return rows.map((row) => {
    const fullData: BackgroundFullData = {
      background: row.backgrounds,
      creator: row.users,
      source: row.sources,
      awards: awardsByBackground.get(row.backgrounds.id) || [],
    };
    return toBackgroundFromFullData(fullData);
  });
};

export const searchPublicBackgrounds = async ({
  searchTerm,
  creatorId,
  sourceId,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchBackgroundsParams & { offset?: number }): Promise<Background[]> => {
  const db = await getDatabase();

  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (searchTerm) {
    conditions.push(like(backgrounds.name, `%${searchTerm}%`));
  }

  if (creatorId) {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.discordId, creatorId))
      .limit(1);

    if (userResult.length > 0) {
      conditions.push(eq(backgrounds.userId, userResult[0].id));
    }
  }

  if (sourceId) {
    conditions.push(eq(backgrounds.sourceId, sourceId));
  }

  // Build order by
  const orderBy =
    sortBy === "name"
      ? sortDirection === "desc"
        ? desc(backgrounds.name)
        : asc(backgrounds.name)
      : sortDirection === "desc"
        ? desc(backgrounds.createdAt)
        : asc(backgrounds.createdAt);

  const rows = await db
    .select()
    .from(backgrounds)
    .innerJoin(users, eq(backgrounds.userId, users.id))
    .leftJoin(sources, eq(backgrounds.sourceId, sources.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit ?? 100)
    .offset(offset ?? 0);

  if (rows.length === 0) return [];

  const backgroundIds = rows.map((r) => r.backgrounds.id);

  // Fetch awards
  const awardRows = await db
    .select({ backgroundId: backgroundsAwards.backgroundId, award: awards })
    .from(backgroundsAwards)
    .innerJoin(awards, eq(backgroundsAwards.awardId, awards.id))
    .where(inArray(backgroundsAwards.backgroundId, backgroundIds));

  const awardsByBackground = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByBackground.get(row.backgroundId) || [];
    existing.push(row.award);
    awardsByBackground.set(row.backgroundId, existing);
  }

  return rows.map((row) => {
    const fullData: BackgroundFullData = {
      background: row.backgrounds,
      creator: row.users,
      source: row.sources,
      awards: awardsByBackground.get(row.backgrounds.id) || [],
    };
    return toBackgroundFromFullData(fullData);
  });
};

export const createBackground = async (
  input: CreateBackgroundInput,
  discordId: string
): Promise<Background> => {
  const { name, description, requirement, sourceId } = input;

  const db = await getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];

  const result = await db
    .insert(backgrounds)
    .values({
      name,
      description,
      requirement: requirement || null,
      userId: user.id,
      sourceId: sourceId || null,
    })
    .returning();

  const createdBackground = result[0];

  // Get source if specified
  let source: SourceRow | null = null;
  if (sourceId) {
    const sourceResult = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId))
      .limit(1);
    source = sourceResult[0] || null;
  }

  const fullData: BackgroundFullData = {
    background: createdBackground,
    creator: user,
    source,
    awards: [],
  };

  return toBackgroundFromFullData(fullData);
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

  const db = await getDatabase();

  // Find user by discordId
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult[0];

  // Update the background
  const result = await db
    .update(backgrounds)
    .set({
      name,
      description,
      requirement: requirement || null,
      sourceId: sourceId || null,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(backgrounds.id, id), eq(backgrounds.userId, user.id)))
    .returning();

  if (result.length === 0) {
    throw new Error("Background not found or not owned by user");
  }

  const updatedBackground = result[0];

  // Get source if specified
  let source: SourceRow | null = null;
  if (sourceId) {
    const sourceResult = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId))
      .limit(1);
    source = sourceResult[0] || null;
  }

  // Fetch awards
  const awardRows = await db
    .select({ award: awards })
    .from(backgroundsAwards)
    .innerJoin(awards, eq(backgroundsAwards.awardId, awards.id))
    .where(eq(backgroundsAwards.backgroundId, id));

  const fullData: BackgroundFullData = {
    background: updatedBackground,
    creator: user,
    source,
    awards: awardRows.map((r) => r.award),
  };

  return toBackgroundFromFullData(fullData);
};

export const findBackgroundsByIds = async (
  ids: string[]
): Promise<Background[]> => {
  const validIds = ids.filter(isValidUUID);
  if (validIds.length === 0) return [];

  const db = await getDatabase();
  const dataMap = await loadBackgroundFullData(db, validIds);

  return validIds
    .map((id) => dataMap.get(id))
    .filter((d): d is BackgroundFullData => d !== undefined)
    .map(toBackgroundFromFullData);
};
