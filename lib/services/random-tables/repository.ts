import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  randomSubtableRows,
  randomSubtables,
  randomTables,
  users,
} from "@/lib/db/schema";
import type { RandomTable, Subtable, User } from "@/lib/types";

export type RandomTableSortBy = "name" | "createdAt";
export type RandomTableSortDirection = "asc" | "desc";

export interface SearchRandomTablesParams {
  searchTerm?: string;
  sortBy: RandomTableSortBy;
  sortDirection: RandomTableSortDirection;
  limit: number;
  offset?: number;
}

const toUserFromRow = (u: typeof users.$inferSelect): User => ({
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

export const searchPublicRandomTables = async ({
  searchTerm,
  sortBy,
  sortDirection = "asc",
  limit,
  offset,
}: SearchRandomTablesParams): Promise<RandomTable[]> => {
  const db = await getDatabase();

  const whereConditions = [eq(randomTables.visibility, "public")];

  if (searchTerm) {
    const searchCondition = or(
      like(randomTables.name, `%${searchTerm}%`),
      like(randomTables.description, `%${searchTerm}%`)
    );
    if (searchCondition) whereConditions.push(searchCondition);
  }

  const orderBy =
    sortBy === "name"
      ? sortDirection === "desc"
        ? desc(randomTables.name)
        : asc(randomTables.name)
      : sortDirection === "desc"
        ? desc(randomTables.createdAt)
        : asc(randomTables.createdAt);

  const tableRows = await db
    .select()
    .from(randomTables)
    .innerJoin(users, eq(randomTables.creatorId, users.id))
    .where(and(...whereConditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset ?? 0);

  if (tableRows.length === 0) return [];

  const subtableRows = await db
    .select()
    .from(randomSubtables)
    .where(
      inArray(
        randomSubtables.randomTableId,
        tableRows.map((r) => r.random_tables.id)
      )
    )
    .orderBy(asc(randomSubtables.orderIndex));

  const rows =
    subtableRows.length > 0
      ? await db
          .select()
          .from(randomSubtableRows)
          .where(
            inArray(
              randomSubtableRows.subtableId,
              subtableRows.map((s) => s.id)
            )
          )
          .orderBy(asc(randomSubtableRows.orderIndex))
      : [];

  const rowsBySubtable = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = rowsBySubtable.get(row.subtableId) ?? [];
    existing.push(row);
    rowsBySubtable.set(row.subtableId, existing);
  }

  const subtablesByTable = new Map<string, Subtable[]>();
  for (const subtable of subtableRows) {
    const existing = subtablesByTable.get(subtable.randomTableId) ?? [];
    existing.push({
      id: subtable.id,
      title: subtable.title,
      notation: subtable.notation,
      rows: (rowsBySubtable.get(subtable.id) ?? []).map((r) => ({
        id: r.id,
        low: r.low,
        high: r.high,
        result: r.result,
      })),
    });
    subtablesByTable.set(subtable.randomTableId, existing);
  }

  return tableRows.map((row) => ({
    id: row.random_tables.id,
    name: row.random_tables.name,
    description: row.random_tables.description ?? undefined,
    visibility:
      row.random_tables.visibility === "private" ? "private" : "public",
    creator: toUserFromRow(row.users),
    subtables: subtablesByTable.get(row.random_tables.id) ?? [],
    createdAt: row.random_tables.createdAt
      ? new Date(row.random_tables.createdAt)
      : undefined,
  }));
};
