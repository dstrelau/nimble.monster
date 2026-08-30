import { and, asc, eq, inArray } from "drizzle-orm";
import { toUser } from "@/lib/db/converters";
import type { RandomTable, Subtable } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { getDatabase } from "./drizzle";
import {
  type RandomTableRowRecord,
  randomSubtableRows,
  randomSubtables,
  randomTables,
  type UserRow,
  users,
} from "./schema";

async function loadSubtablesByTableId(
  db: ReturnType<typeof getDatabase>,
  tableIds: string[]
): Promise<Map<string, Subtable[]>> {
  const byTable = new Map<string, Subtable[]>();
  if (tableIds.length === 0) return byTable;

  const subtableRows = await db
    .select()
    .from(randomSubtables)
    .where(inArray(randomSubtables.randomTableId, tableIds))
    .orderBy(asc(randomSubtables.orderIndex));

  if (subtableRows.length === 0) return byTable;

  const rows = await db
    .select()
    .from(randomSubtableRows)
    .where(
      inArray(
        randomSubtableRows.subtableId,
        subtableRows.map((s) => s.id)
      )
    )
    .orderBy(asc(randomSubtableRows.orderIndex));

  const rowsBySubtable = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = rowsBySubtable.get(row.subtableId) ?? [];
    existing.push(row);
    rowsBySubtable.set(row.subtableId, existing);
  }

  for (const subtable of subtableRows) {
    const existing = byTable.get(subtable.randomTableId) ?? [];
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
    byTable.set(subtable.randomTableId, existing);
  }

  return byTable;
}

function toRandomTable(
  table: RandomTableRowRecord,
  creator: UserRow,
  subtables: Subtable[]
): RandomTable {
  return {
    id: table.id,
    name: table.name,
    description: table.description || undefined,
    visibility: (table.visibility ?? "public") as "public" | "private",
    creator: toUser(creator),
    subtables,
    createdAt: table.createdAt ? new Date(table.createdAt) : undefined,
  };
}

async function replaceSubtables(
  db: Parameters<
    Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
  >[0],
  randomTableId: string,
  subtables: Subtable[]
): Promise<void> {
  const existing = await db
    .select({ id: randomSubtables.id })
    .from(randomSubtables)
    .where(eq(randomSubtables.randomTableId, randomTableId));

  if (existing.length > 0) {
    await db.delete(randomSubtableRows).where(
      inArray(
        randomSubtableRows.subtableId,
        existing.map((s) => s.id)
      )
    );
    await db
      .delete(randomSubtables)
      .where(eq(randomSubtables.randomTableId, randomTableId));
  }

  if (subtables.length === 0) return;

  const subtableValues = subtables.map((subtable, index) => ({
    id: crypto.randomUUID(),
    randomTableId,
    title: subtable.title,
    notation: subtable.notation,
    orderIndex: index,
  }));
  await db.insert(randomSubtables).values(subtableValues);

  const rowValues = subtables.flatMap((subtable, subtableIndex) =>
    subtable.rows.map((row, rowIndex) => ({
      subtableId: subtableValues[subtableIndex].id,
      low: row.low,
      high: row.high,
      result: row.result,
      orderIndex: rowIndex,
    }))
  );
  if (rowValues.length > 0) {
    await db.insert(randomSubtableRows).values(rowValues);
  }
}

const findUserByDiscordId = async (
  db: ReturnType<typeof getDatabase>,
  discordId: string
): Promise<UserRow | null> => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);
  return result[0] ?? null;
};

export const listRandomTablesForUser = async (
  discordId: string
): Promise<RandomTable[]> => {
  const db = getDatabase();

  const user = await findUserByDiscordId(db, discordId);
  if (!user) return [];

  const tableRows = await db
    .select()
    .from(randomTables)
    .where(eq(randomTables.creatorId, user.id))
    .orderBy(asc(randomTables.name));

  const subtablesByTable = await loadSubtablesByTableId(
    db,
    tableRows.map((t) => t.id)
  );

  return tableRows.map((table) =>
    toRandomTable(table, user, subtablesByTable.get(table.id) ?? [])
  );
};

export const getPublicRandomTableById = async (
  id: string
): Promise<RandomTable | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const result = await db
    .select({ table: randomTables, creator: users })
    .from(randomTables)
    .innerJoin(users, eq(randomTables.creatorId, users.id))
    .where(and(eq(randomTables.id, id), eq(randomTables.visibility, "public")))
    .limit(1);

  if (result.length === 0) return null;

  const subtablesByTable = await loadSubtablesByTableId(db, [id]);
  return toRandomTable(
    result[0].table,
    result[0].creator,
    subtablesByTable.get(id) ?? []
  );
};

export const getRandomTable = async (
  id: string,
  discordId?: string
): Promise<RandomTable | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  if (discordId) {
    const user = await findUserByDiscordId(db, discordId);
    if (user) {
      const owned = await db
        .select({ table: randomTables, creator: users })
        .from(randomTables)
        .innerJoin(users, eq(randomTables.creatorId, users.id))
        .where(
          and(eq(randomTables.id, id), eq(randomTables.creatorId, user.id))
        )
        .limit(1);

      if (owned.length > 0) {
        const subtablesByTable = await loadSubtablesByTableId(db, [id]);
        return toRandomTable(
          owned[0].table,
          owned[0].creator,
          subtablesByTable.get(id) ?? []
        );
      }
    }
  }

  return getPublicRandomTableById(id);
};

export interface CreateRandomTableInput {
  discordId: string;
  name: string;
  description?: string;
  visibility: "public" | "private";
  subtables: Subtable[];
}

export interface UpdateRandomTableInput extends CreateRandomTableInput {
  id: string;
}

export const createRandomTable = async (
  input: CreateRandomTableInput
): Promise<RandomTable> => {
  const db = getDatabase();

  const user = await findUserByDiscordId(db, input.discordId);
  if (!user) throw new Error("User not found");

  const id = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(randomTables).values({
      id,
      name: input.name,
      description: input.description || "",
      visibility: input.visibility,
      creatorId: user.id,
    });
    await replaceSubtables(tx, id, input.subtables);
  });

  const result = await db
    .select()
    .from(randomTables)
    .where(eq(randomTables.id, id))
    .limit(1);

  const subtablesByTable = await loadSubtablesByTableId(db, [id]);
  return toRandomTable(result[0], user, subtablesByTable.get(id) ?? []);
};

export const updateRandomTable = async (
  input: UpdateRandomTableInput
): Promise<RandomTable> => {
  const db = getDatabase();

  const user = await findUserByDiscordId(db, input.discordId);
  if (!user) throw new Error("User not found");

  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(randomTables)
      .where(
        and(eq(randomTables.id, input.id), eq(randomTables.creatorId, user.id))
      )
      .limit(1);

    if (existing.length === 0) throw new Error("Random table not found");

    await tx
      .update(randomTables)
      .set({
        name: input.name,
        description: input.description || "",
        visibility: input.visibility,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(randomTables.id, input.id));

    await replaceSubtables(tx, input.id, input.subtables);
  });

  const result = await db
    .select()
    .from(randomTables)
    .where(eq(randomTables.id, input.id))
    .limit(1);

  const subtablesByTable = await loadSubtablesByTableId(db, [input.id]);
  return toRandomTable(result[0], user, subtablesByTable.get(input.id) ?? []);
};

export const deleteRandomTable = async (input: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(input.id)) return false;

  const db = getDatabase();

  const user = await findUserByDiscordId(db, input.discordId);
  if (!user) return false;

  const result = await db
    .delete(randomTables)
    .where(
      and(eq(randomTables.id, input.id), eq(randomTables.creatorId, user.id))
    );

  return result.rowsAffected > 0;
};
