import { eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import { CLASS_DRAFT_NEW_SENTINEL, users } from "@/lib/db/schema";
import * as repository from "./repository";
import type { ClassDraft } from "./types";

const NEW_CLASS_SENTINEL = CLASS_DRAFT_NEW_SENTINEL;

function toSentinel(classId: string | null): string {
  return classId ?? NEW_CLASS_SENTINEL;
}

function fromSentinel(classId: string): string | null {
  return classId === NEW_CLASS_SENTINEL ? null : classId;
}

async function resolveUserId(discordId: string): Promise<string | null> {
  const db = getDatabase();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);
  return row?.id ?? null;
}

export class ClassDraftsService {
  async save(
    discordId: string,
    classId: string | null,
    data: unknown
  ): Promise<ClassDraft | null> {
    const userId = await resolveUserId(discordId);
    if (!userId) return null;

    const row = await repository.upsertClassDraft({
      userId,
      classId: toSentinel(classId),
      data,
    });

    return {
      id: row.id,
      classId: fromSentinel(row.classId),
      data: row.data,
      updatedAt: new Date(row.updatedAt ?? Date.now()),
    };
  }

  async get(
    discordId: string,
    classId: string | null
  ): Promise<ClassDraft | null> {
    const userId = await resolveUserId(discordId);
    if (!userId) return null;

    const row = await repository.getClassDraft({
      userId,
      classId: toSentinel(classId),
    });
    if (!row) return null;

    return {
      id: row.id,
      classId: fromSentinel(row.classId),
      data: row.data,
      updatedAt: new Date(row.updatedAt ?? Date.now()),
    };
  }

  async delete(discordId: string, classId: string | null): Promise<void> {
    const userId = await resolveUserId(discordId);
    if (!userId) return;

    await repository.deleteClassDraft({
      userId,
      classId: toSentinel(classId),
    });
  }
}

export const classDraftsService = new ClassDraftsService();
