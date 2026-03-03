import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { classDrafts } from "@/lib/db/schema";

export async function upsertClassDraft({
  userId,
  classId,
  data,
}: {
  userId: string;
  classId: string;
  data: unknown;
}) {
  const db = getDatabase();
  const [row] = await db
    .insert(classDrafts)
    .values({
      userId,
      classId,
      data,
    })
    .onConflictDoUpdate({
      target: [classDrafts.userId, classDrafts.classId],
      set: {
        data,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();
  return row;
}

export async function getClassDraft({
  userId,
  classId,
}: {
  userId: string;
  classId: string;
}) {
  const db = getDatabase();
  const [row] = await db
    .select()
    .from(classDrafts)
    .where(
      and(eq(classDrafts.userId, userId), eq(classDrafts.classId, classId))
    )
    .limit(1);
  return row ?? null;
}

export async function deleteClassDraft({
  userId,
  classId,
}: {
  userId: string;
  classId: string;
}) {
  const db = getDatabase();
  await db
    .delete(classDrafts)
    .where(
      and(eq(classDrafts.userId, userId), eq(classDrafts.classId, classId))
    );
}
