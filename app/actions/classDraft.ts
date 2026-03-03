"use server";

import { auth } from "@/lib/auth";
import { classDraftsService } from "@/lib/services/classdrafts";

export async function saveClassDraft(
  classId: string | null,
  data: unknown
): Promise<{ success: boolean; updatedAt?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.discordId) {
      return { success: false };
    }

    const draft = await classDraftsService.save(
      session.user.discordId,
      classId,
      data
    );
    if (!draft) return { success: false };

    return { success: true, updatedAt: draft.updatedAt.toISOString() };
  } catch {
    return { success: false };
  }
}

export async function getClassDraft(classId: string | null): Promise<{
  success: boolean;
  draft: { data: unknown; updatedAt: string } | null;
}> {
  try {
    const session = await auth();
    if (!session?.user?.discordId) {
      return { success: false, draft: null };
    }

    const draft = await classDraftsService.get(session.user.discordId, classId);
    if (!draft) return { success: true, draft: null };

    return {
      success: true,
      draft: {
        data: draft.data,
        updatedAt: draft.updatedAt.toISOString(),
      },
    };
  } catch {
    return { success: false, draft: null };
  }
}

export async function deleteClassDraft(
  classId: string | null
): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.discordId) {
      return { success: false };
    }

    await classDraftsService.delete(session.user.discordId, classId);
    return { success: true };
  } catch {
    return { success: false };
  }
}
