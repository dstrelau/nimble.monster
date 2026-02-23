"use server";
import { and, asc, desc, eq, gt, inArray, like, lt, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type AncestryRow,
  type AwardRow,
  ancestries,
  ancestriesAwards,
  awards,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "@/lib/db/schema";
import { OFFICIAL_USER_ID } from "@/lib/services/monsters/official";
import type { Source, User } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import { isValidUUID } from "@/lib/utils/validation";
import type { PaginateAncestriesParams } from "./service";
import type {
  Ancestry,
  AncestryAbility,
  AncestryMini,
  AncestryRarity,
  AncestrySize,
  CreateAncestryInput,
  SearchAncestriesParams,
  UpdateAncestryInput,
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

const parseSizeFromRow = (size: string): AncestrySize[] => {
  if (!size) return [];
  try {
    return JSON.parse(size) as AncestrySize[];
  } catch {
    return [];
  }
};

const parseAbilitiesFromRow = (abilities: unknown): AncestryAbility[] => {
  if (!abilities) return [];
  return abilities as AncestryAbility[];
};

const toAncestryMiniFromRow = (a: AncestryRow): AncestryMini => ({
  id: a.id,
  name: a.name,
  size: parseSizeFromRow(a.size),
  rarity: (a.rarity ?? "common") as AncestryRarity,
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
});

interface AncestryFullData {
  ancestry: AncestryRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
}

const toAncestryFromFullData = (data: AncestryFullData): Ancestry => ({
  id: data.ancestry.id,
  name: data.ancestry.name,
  size: parseSizeFromRow(data.ancestry.size),
  rarity: (data.ancestry.rarity ?? "common") as AncestryRarity,
  createdAt: data.ancestry.createdAt
    ? new Date(data.ancestry.createdAt)
    : new Date(),
  updatedAt: data.ancestry.updatedAt
    ? new Date(data.ancestry.updatedAt)
    : new Date(),
  description: data.ancestry.description,
  abilities: parseAbilitiesFromRow(data.ancestry.abilities),
  creator: toUserFromRow(data.creator),
  source: toSourceFromRow(data.source),
  awards: data.awards.map(toAwardFromRow),
});

async function loadAncestryFullData(
  db: Awaited<ReturnType<typeof getDatabase>>,
  ancestryIds: string[]
): Promise<Map<string, AncestryFullData>> {
  if (ancestryIds.length === 0) return new Map();

  const ancestryRows = await db
    .select()
    .from(ancestries)
    .innerJoin(users, eq(ancestries.userId, users.id))
    .leftJoin(sources, eq(ancestries.sourceId, sources.id))
    .where(inArray(ancestries.id, ancestryIds));

  const awardRows = await db
    .select({ ancestryId: ancestriesAwards.ancestryId, award: awards })
    .from(ancestriesAwards)
    .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
    .where(inArray(ancestriesAwards.ancestryId, ancestryIds));

  const awardsByAncestry = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByAncestry.get(row.ancestryId) || [];
    existing.push(row.award);
    awardsByAncestry.set(row.ancestryId, existing);
  }

  const result = new Map<string, AncestryFullData>();
  for (const row of ancestryRows) {
    result.set(row.ancestries.id, {
      ancestry: row.ancestries,
      creator: row.users,
      source: row.sources,
      awards: awardsByAncestry.get(row.ancestries.id) || [],
    });
  }

  return result;
}

export const deleteAncestry = async (
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
    .delete(ancestries)
    .where(and(eq(ancestries.id, id), eq(ancestries.userId, userResult[0].id)));

  return result.rowsAffected > 0;
};

export const listPublicAncestries = async (): Promise<AncestryMini[]> => {
  const db = await getDatabase();

  const result = await db
    .select()
    .from(ancestries)
    .orderBy(asc(ancestries.name));

  return result.map(toAncestryMiniFromRow);
};

export const paginatePublicAncestries = async ({
  cursor,
  limit = 100,
  sort = "-createdAt",
  search,
  creatorId,
  source,
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

  const db = await getDatabase();

  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (creatorId) {
    conditions.push(eq(ancestries.userId, creatorId));
  }

  if (source) {
    conditions.push(eq(sources.abbreviation, source));
  }

  if (search) {
    conditions.push(like(ancestries.name, `%${search}%`));
  }

  // Build cursor conditions
  let cursorConditions: ReturnType<typeof or> | undefined;
  if (cursorData) {
    const op = isDesc ? lt : gt;

    if (sortField === "name") {
      cursorConditions = or(
        op(ancestries.name, cursorData.value as string),
        and(
          eq(ancestries.name, cursorData.value as string),
          gt(ancestries.id, cursorData.id)
        )
      );
    } else if (sortField === "createdAt") {
      cursorConditions = or(
        op(ancestries.createdAt, cursorData.value as string),
        and(
          eq(ancestries.createdAt, cursorData.value as string),
          gt(ancestries.id, cursorData.id)
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
          isDesc ? desc(ancestries.name) : asc(ancestries.name),
          asc(ancestries.id),
        ]
      : [
          isDesc ? desc(ancestries.createdAt) : asc(ancestries.createdAt),
          asc(ancestries.id),
        ];

  // Query ancestries
  const rows = await db
    .select()
    .from(ancestries)
    .innerJoin(users, eq(ancestries.userId, users.id))
    .leftJoin(sources, eq(ancestries.sourceId, sources.id))
    .where(allConditions.length > 0 ? and(...allConditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  // Get ancestry IDs for award lookup
  const ancestryIds = resultRows.map((r) => r.ancestries.id);

  // Fetch awards
  const awardRows =
    ancestryIds.length > 0
      ? await db
          .select({ ancestryId: ancestriesAwards.ancestryId, award: awards })
          .from(ancestriesAwards)
          .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
          .where(inArray(ancestriesAwards.ancestryId, ancestryIds))
      : [];

  const awardsByAncestry = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByAncestry.get(row.ancestryId) || [];
    existing.push(row.award);
    awardsByAncestry.set(row.ancestryId, existing);
  }

  // Convert to Ancestry objects
  const results = resultRows.map((row) => {
    const fullData: AncestryFullData = {
      ancestry: row.ancestries,
      creator: row.users,
      source: row.sources,
      awards: awardsByAncestry.get(row.ancestries.id) || [],
    };
    return toAncestryFromFullData(fullData);
  });

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && resultRows.length > 0) {
    const lastRow = resultRows[resultRows.length - 1];
    const cursorData: CursorData = {
      sort: sort as "name" | "-name" | "createdAt" | "-createdAt",
      value:
        sortField === "name"
          ? lastRow.ancestries.name
          : (lastRow.ancestries.createdAt ?? new Date().toISOString()),
      id: lastRow.ancestries.id,
    };
    nextCursor = encodeCursor(cursorData);
  }

  return { data: results, nextCursor };
};

export const findAncestry = async (id: string): Promise<Ancestry | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  const fullDataMap = await loadAncestryFullData(db, [id]);
  const fullData = fullDataMap.get(id);

  return fullData ? toAncestryFromFullData(fullData) : null;
};

export const findAncestryWithCreatorId = async (
  id: string,
  creatorId: string
): Promise<Ancestry | null> => {
  if (!isValidUUID(id)) return null;

  const db = await getDatabase();

  const result = await db
    .select()
    .from(ancestries)
    .innerJoin(users, eq(ancestries.userId, users.id))
    .leftJoin(sources, eq(ancestries.sourceId, sources.id))
    .where(and(eq(ancestries.id, id), eq(ancestries.userId, creatorId)))
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];

  // Fetch awards
  const awardRows = await db
    .select({ award: awards })
    .from(ancestriesAwards)
    .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
    .where(eq(ancestriesAwards.ancestryId, id));

  const fullData: AncestryFullData = {
    ancestry: row.ancestries,
    creator: row.users,
    source: row.sources,
    awards: awardRows.map((r) => r.award),
  };

  return toAncestryFromFullData(fullData);
};

export const listAllAncestriesForDiscordID = async (
  discordId: string
): Promise<Ancestry[]> => {
  const db = await getDatabase();

  const rows = await db
    .select()
    .from(ancestries)
    .innerJoin(users, eq(ancestries.userId, users.id))
    .leftJoin(sources, eq(ancestries.sourceId, sources.id))
    .where(eq(users.discordId, discordId))
    .orderBy(asc(ancestries.name));

  if (rows.length === 0) return [];

  const ancestryIds = rows.map((r) => r.ancestries.id);

  // Fetch awards
  const awardRows = await db
    .select({ ancestryId: ancestriesAwards.ancestryId, award: awards })
    .from(ancestriesAwards)
    .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
    .where(inArray(ancestriesAwards.ancestryId, ancestryIds));

  const awardsByAncestry = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByAncestry.get(row.ancestryId) || [];
    existing.push(row.award);
    awardsByAncestry.set(row.ancestryId, existing);
  }

  return rows.map((row) => {
    const fullData: AncestryFullData = {
      ancestry: row.ancestries,
      creator: row.users,
      source: row.sources,
      awards: awardsByAncestry.get(row.ancestries.id) || [],
    };
    return toAncestryFromFullData(fullData);
  });
};

export const searchPublicAncestries = async ({
  searchTerm,
  creatorId,
  source,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchAncestriesParams & { offset?: number }): Promise<Ancestry[]> => {
  const db = await getDatabase();

  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (searchTerm) {
    conditions.push(like(ancestries.name, `%${searchTerm}%`));
  }

  if (creatorId) {
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.discordId, creatorId))
      .limit(1);

    if (userResult.length > 0) {
      conditions.push(eq(ancestries.userId, userResult[0].id));
    }
  }

  if (source) {
    conditions.push(eq(sources.abbreviation, source));
  }

  // Build order by
  const orderBy =
    sortBy === "name"
      ? sortDirection === "desc"
        ? desc(ancestries.name)
        : asc(ancestries.name)
      : sortDirection === "desc"
        ? desc(ancestries.createdAt)
        : asc(ancestries.createdAt);

  const rows = await db
    .select()
    .from(ancestries)
    .innerJoin(users, eq(ancestries.userId, users.id))
    .leftJoin(sources, eq(ancestries.sourceId, sources.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit ?? 100)
    .offset(offset ?? 0);

  if (rows.length === 0) return [];

  const ancestryIds = rows.map((r) => r.ancestries.id);

  // Fetch awards
  const awardRows = await db
    .select({ ancestryId: ancestriesAwards.ancestryId, award: awards })
    .from(ancestriesAwards)
    .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
    .where(inArray(ancestriesAwards.ancestryId, ancestryIds));

  const awardsByAncestry = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByAncestry.get(row.ancestryId) || [];
    existing.push(row.award);
    awardsByAncestry.set(row.ancestryId, existing);
  }

  return rows.map((row) => {
    const fullData: AncestryFullData = {
      ancestry: row.ancestries,
      creator: row.users,
      source: row.sources,
      awards: awardsByAncestry.get(row.ancestries.id) || [],
    };
    return toAncestryFromFullData(fullData);
  });
};

export const createAncestry = async (
  input: CreateAncestryInput,
  discordId: string
): Promise<Ancestry> => {
  const { name, description, size, rarity, abilities, sourceId } = input;

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
    .insert(ancestries)
    .values({
      name,
      description,
      size: JSON.stringify(size),
      rarity,
      abilities: abilities,
      userId: user.id,
      sourceId: sourceId || null,
    })
    .returning();

  const createdAncestry = result[0];

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

  const fullData: AncestryFullData = {
    ancestry: createdAncestry,
    creator: user,
    source,
    awards: [],
  };

  return toAncestryFromFullData(fullData);
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

  // Update the ancestry
  const result = await db
    .update(ancestries)
    .set({
      name,
      description,
      size: JSON.stringify(size),
      rarity,
      abilities: abilities,
      sourceId: sourceId || null,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(ancestries.id, id), eq(ancestries.userId, user.id)))
    .returning();

  if (result.length === 0) {
    throw new Error("Ancestry not found or not owned by user");
  }

  const updatedAncestry = result[0];

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
    .from(ancestriesAwards)
    .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
    .where(eq(ancestriesAwards.ancestryId, id));

  const fullData: AncestryFullData = {
    ancestry: updatedAncestry,
    creator: user,
    source,
    awards: awardRows.map((r) => r.award),
  };

  return toAncestryFromFullData(fullData);
};

export const findAncestriesByIds = async (
  ids: string[]
): Promise<Ancestry[]> => {
  const validIds = ids.filter(isValidUUID);
  if (validIds.length === 0) return [];

  const db = await getDatabase();
  const dataMap = await loadAncestryFullData(db, validIds);

  return validIds
    .map((id) => dataMap.get(id))
    .filter((d): d is AncestryFullData => d !== undefined)
    .map(toAncestryFromFullData);
};

export const upsertOfficialAncestry = async (
  input: CreateAncestryInput
): Promise<void> => {
  const db = await getDatabase();

  const existing = await db
    .select({ id: ancestries.id })
    .from(ancestries)
    .where(
      and(
        eq(ancestries.name, input.name),
        eq(ancestries.userId, OFFICIAL_USER_ID)
      )
    )
    .limit(1);

  const values = {
    name: input.name,
    description: input.description,
    size: JSON.stringify(input.size),
    rarity: input.rarity,
    abilities: input.abilities,
    visibility: "public",
    sourceId: input.sourceId || null,
    updatedAt: new Date().toISOString(),
  };

  if (existing.length > 0) {
    await db
      .update(ancestries)
      .set(values)
      .where(eq(ancestries.id, existing[0].id));
  } else {
    await db.insert(ancestries).values({
      id: crypto.randomUUID(),
      ...values,
      userId: OFFICIAL_USER_ID,
      // Fixed timestamp so official content sorts consistently before user content
      createdAt: "2024-01-01 00:00:00",
    });
  }
};

export const findOfficialAncestriesByNames = async (
  names: string[]
): Promise<Map<string, Ancestry>> => {
  if (names.length === 0) return new Map();

  const db = await getDatabase();

  const rows = await db
    .select()
    .from(ancestries)
    .innerJoin(users, eq(ancestries.userId, users.id))
    .leftJoin(sources, eq(ancestries.sourceId, sources.id))
    .where(
      and(
        inArray(ancestries.name, names),
        eq(ancestries.userId, OFFICIAL_USER_ID)
      )
    );

  if (rows.length === 0) return new Map();

  const ancestryIds = rows.map((r) => r.ancestries.id);

  const awardRows = await db
    .select({ ancestryId: ancestriesAwards.ancestryId, award: awards })
    .from(ancestriesAwards)
    .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
    .where(inArray(ancestriesAwards.ancestryId, ancestryIds));

  const awardsByAncestry = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByAncestry.get(row.ancestryId) || [];
    existing.push(row.award);
    awardsByAncestry.set(row.ancestryId, existing);
  }

  const result = new Map<string, Ancestry>();
  for (const row of rows) {
    const ancestry = toAncestryFromFullData({
      ancestry: row.ancestries,
      creator: row.users,
      source: row.sources,
      awards: awardsByAncestry.get(row.ancestries.id) || [],
    });
    result.set(ancestry.name, ancestry);
  }
  return result;
};
