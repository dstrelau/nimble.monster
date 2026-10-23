import { defineRoute } from "@/lib/contract";
import type { ReactableEntityType, ReactionType } from "@/lib/db/schema";
import type { ReactionsSummary } from "@/lib/services/reactions";

interface ToggleReactionInput {
  entityType: ReactableEntityType;
  entityId: string;
  reactionType: ReactionType;
}

export const toggleReaction = defineRoute<
  ToggleReactionInput,
  { success: true; data: ReactionsSummary }
>({
  method: "POST",
  path: () => "/_actions/toggleReaction",
});
