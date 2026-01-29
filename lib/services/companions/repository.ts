import { and, asc, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { parseJsonField } from "@/lib/db/converters";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type AwardRow,
  awards,
  type CompanionRow,
  companions,
  companionsAwards,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "@/lib/db/schema";
import type { Ability, Action, Companion, User } from "@/lib/types";
import type { CursorData } from "@/lib/utils/cursor";
import { decodeCursor, encodeCursor } from "@/lib/utils/cursor";
import type {
  PaginateCompanionsSortOption,
  PaginateMonstersParams,
  PaginatePublicCompanionsResponse,
} from "./types";

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

const toAbilitiesFromRow = (raw: unknown): Ability[] => {
  return parseJsonField<{ name: string; description: string }>(raw).map(
    (a) => ({
      id: crypto.randomUUID(),
      name: a.name,
      description: a.description,
    })
  );
};

const toActionsFromRow = (raw: unknown): Action[] => {
  return parseJsonField<{
    name: string;
    description: string;
    extended?: boolean;
  }>(raw).map((a) => ({
    id: crypto.randomUUID(),
    name: a.name,
    description: a.description,
    extended: a.extended,
  }));
};

interface CompanionFullData {
  companion: CompanionRow;
  creator: UserRow;
  source: SourceRow | null;
  awards: AwardRow[];
}

const toCompanionFromFullData = (data: CompanionFullData): Companion => ({
  id: data.companion.id,
  name: data.companion.name,
  hp_per_level: data.companion.hpPerLevel,
  wounds: data.companion.wounds,
  visibility: (data.companion.visibility ?? "public") as "public" | "private",
  kind: data.companion.kind,
  class: data.companion.class,
  size: data.companion.size,
  saves: data.companion.saves,
  abilities: toAbilitiesFromRow(data.companion.abilities),
  actions: toActionsFromRow(data.companion.actions),
  actionPreface: data.companion.actionPreface || "",
  dyingRule: data.companion.dyingRule,
  moreInfo: data.companion.moreInfo || "",
  creator: toUserFromRow(data.creator),
  source: data.source
    ? {
        id: data.source.id,
        name: data.source.name,
        abbreviation: data.source.abbreviation,
        license: data.source.license,
        link: data.source.link,
        createdAt: data.source.createdAt
          ? new Date(data.source.createdAt)
          : new Date(),
        updatedAt: data.source.updatedAt
          ? new Date(data.source.updatedAt)
          : new Date(),
      }
    : undefined,
  awards: data.awards.map((a) => ({
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
  })),
  updatedAt: data.companion.updatedAt
    ? new Date(data.companion.updatedAt)
    : new Date(),
});

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

  const db = await getDatabase();

  // Build where conditions
  const conditions = [eq(companions.visibility, "public")];

  if (creatorId) {
    conditions.push(eq(companions.userId, creatorId));
  }

  if (companionClass !== "all") {
    conditions.push(like(companions.class, `%${companionClass}%`));
  }

  // Build cursor conditions
  let cursorConditions: ReturnType<typeof or> | undefined;
  if (cursorData) {
    const op = isDesc ? lt : gt;

    if (sortField === "name") {
      cursorConditions = or(
        op(companions.name, cursorData.value as string),
        and(
          eq(companions.name, cursorData.value as string),
          gt(companions.id, cursorData.id)
        )
      );
    } else if (sortField === "createdAt") {
      const dateStr = cursorData.value as string;
      cursorConditions = or(
        op(companions.createdAt, dateStr),
        and(eq(companions.createdAt, dateStr), gt(companions.id, cursorData.id))
      );
    }
  }

  // Build search conditions
  let searchConditions: ReturnType<typeof or> | undefined;
  if (search) {
    searchConditions = or(
      like(companions.name, `%${search}%`),
      like(companions.kind, `%${search}%`),
      like(companions.class, `%${search}%`)
    );
  }

  // Combine all conditions
  const allConditions = [...conditions];
  if (cursorConditions) {
    allConditions.push(cursorConditions);
  }
  if (searchConditions) {
    allConditions.push(searchConditions);
  }

  // Build order by
  const orderBy =
    sortField === "name"
      ? [
          isDesc ? desc(companions.name) : asc(companions.name),
          asc(companions.id),
        ]
      : [
          isDesc ? desc(companions.createdAt) : asc(companions.createdAt),
          asc(companions.id),
        ];

  // Query companions with joins
  const rows = await db
    .select()
    .from(companions)
    .innerJoin(users, eq(companions.userId, users.id))
    .leftJoin(sources, eq(companions.sourceId, sources.id))
    .where(and(...allConditions))
    .orderBy(...orderBy)
    .limit(limit + 1);

  // Get companion IDs for award lookup
  const companionIds = rows.slice(0, limit).map((r) => r.companions.id);

  // Fetch awards for companions
  const awardRows =
    companionIds.length > 0
      ? await db
          .select({
            companionId: companionsAwards.companionId,
            award: awards,
          })
          .from(companionsAwards)
          .innerJoin(awards, eq(companionsAwards.awardId, awards.id))
          .where(
            or(
              ...companionIds.map((id) => eq(companionsAwards.companionId, id))
            )
          )
      : [];

  // Group awards by companion
  const awardsByCompanion = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByCompanion.get(row.companionId) || [];
    existing.push(row.award);
    awardsByCompanion.set(row.companionId, existing);
  }

  // Determine pagination
  const hasMore = rows.length > limit;
  const resultRows = hasMore ? rows.slice(0, limit) : rows;

  // Convert to full data and then to Companion type
  const results = resultRows.map((row) => {
    const fullData: CompanionFullData = {
      companion: row.companions,
      creator: row.users,
      source: row.sources,
      awards: awardsByCompanion.get(row.companions.id) || [],
    };
    return toCompanionFromFullData(fullData);
  });

  // Build next cursor
  let nextCursor: string | null = null;
  if (hasMore && results.length > 0) {
    const lastCompanion = resultRows[resultRows.length - 1].companions;
    const cursorData: CursorData = {
      sort: sort as PaginateCompanionsSortOption,
      value:
        sortField === "name"
          ? lastCompanion.name
          : (lastCompanion.createdAt ?? new Date().toISOString()),
      id: lastCompanion.id,
    };
    nextCursor = encodeCursor(cursorData);
  }

  return {
    data: results,
    nextCursor,
  };
};
