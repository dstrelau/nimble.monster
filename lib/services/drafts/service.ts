import { eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { DRAFT_NEW_SENTINEL, type DraftRow, users } from "@/lib/db/schema";
import * as repository from "./repository";
import type { Draft, DraftEntityType } from "./types";

async function resolveUserId(discordId: string): Promise<string | null> {
  const db = getDatabase();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);
  return row?.id ?? null;
}

function toDraft(row: DraftRow, entityType: DraftEntityType): Draft {
  return {
    id: row.id,
    entityType,
    entityId: row.entityId === DRAFT_NEW_SENTINEL ? null : row.entityId,
    data: row.data,
    updatedAt: new Date(row.updatedAt ?? Date.now()),
  };
}

export class DraftsService {
  async save(
    discordId: string,
    entityType: DraftEntityType,
    entityId: string | null,
    data: unknown
  ): Promise<Draft | null> {
    const userId = await resolveUserId(discordId);
    if (!userId) return null;

    const row = await repository.upsertDraft({
      userId,
      entityType,
      entityId: entityId ?? DRAFT_NEW_SENTINEL,
      data,
    });
    return toDraft(row, entityType);
  }

  async get(
    discordId: string,
    entityType: DraftEntityType,
    entityId: string | null
  ): Promise<Draft | null> {
    const userId = await resolveUserId(discordId);
    if (!userId) return null;

    const row = await repository.getDraft({
      userId,
      entityType,
      entityId: entityId ?? DRAFT_NEW_SENTINEL,
    });
    return row ? toDraft(row, entityType) : null;
  }

  async delete(
    discordId: string,
    entityType: DraftEntityType,
    entityId: string | null
  ): Promise<void> {
    const userId = await resolveUserId(discordId);
    if (!userId) return;

    await repository.deleteDraft({
      userId,
      entityType,
      entityId: entityId ?? DRAFT_NEW_SENTINEL,
    });
  }
}

export const draftsService = new DraftsService();
