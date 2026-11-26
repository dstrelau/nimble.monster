import { defineRoute } from "@/lib/contract";
import type { ReactableEntityType } from "@/lib/db/schema";
import type { ReactionsSummary } from "@/lib/services/reactions";

interface GetMyReactionsBatchInput {
  entityType: ReactableEntityType;
  entityIds: string[];
}

export const MAX_REACTIONS_BATCH = 100;

export const getMyReactionsBatch = defineRoute<
  GetMyReactionsBatchInput,
  Record<string, ReactionsSummary>
>({
  method: "GET",
  path: (input) =>
    `/_actions/getMyReactionsBatch?${new URLSearchParams({
      entityType: input.entityType,
      entityIds: input.entityIds.join(","),
    })}`,
});
