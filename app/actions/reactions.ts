"use server";

import { auth } from "@/lib/auth";
import type { ReactableEntityType, ReactionType } from "@/lib/db/schema";
import {
  getReactionsSummary,
  type ReactionsSummary,
  toggleReaction,
} from "@/lib/services/reactions";

export async function getMyReactions(
  entityType: ReactableEntityType,
  entityId: string
): Promise<ReactionsSummary> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      counts: { thumbs_up: 0, thumbs_down: 0 },
      mine: [],
    };
  }
  return getReactionsSummary(entityType, entityId, session.user.id);
}

export async function toggleMyReaction(
  entityType: ReactableEntityType,
  entityId: string,
  reactionType: ReactionType
): Promise<{
  success: boolean;
  data?: ReactionsSummary;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  const data = await toggleReaction(
    entityType,
    entityId,
    session.user.id,
    reactionType
  );
  return { success: true, data };
}
