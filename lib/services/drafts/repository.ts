import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { drafts } from "@/lib/db/schema";

interface DraftKey {
  userId: string;
  entityType: string;
  entityId: string;
}

function matches({ userId, entityType, entityId }: DraftKey) {
  return and(
    eq(drafts.userId, userId),
    eq(drafts.entityType, entityType),
    eq(drafts.entityId, entityId)
  );
}

export async function upsertDraft(key: DraftKey & { data: unknown }) {
  const db = getDatabase();
  const [row] = await db
    .insert(drafts)
    .values(key)
    .onConflictDoUpdate({
      target: [drafts.userId, drafts.entityType, drafts.entityId],
      set: {
        data: key.data,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();
  return row;
}

export async function getDraft(key: DraftKey) {
  const db = getDatabase();
  const [row] = await db.select().from(drafts).where(matches(key)).limit(1);
  return row ?? null;
}

export async function deleteDraft(key: DraftKey) {
  const db = getDatabase();
  await db.delete(drafts).where(matches(key));
}
