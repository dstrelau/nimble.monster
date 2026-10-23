"use server";

import { auth } from "@/lib/auth";
import type { ReactableEntityType } from "@/lib/db/schema";
import { findAncestry } from "@/lib/services/ancestries/repository";
import {
  getReactionsSummary,
  type ReactionsSummary,
} from "@/lib/services/reactions";

export async function getMyReactions(
  entityType: ReactableEntityType,
  entityId: string
): Promise<ReactionsSummary> {
  const session = await auth();
  if (
    !session?.user?.id ||
    (entityType === "ancestry" && !(await findAncestry(entityId)))
  ) {
    return {
      counts: { thumbs_up: 0, thumbs_down: 0 },
      mine: [],
    };
  }
  return getReactionsSummary(entityType, entityId, session.user.id);
}
