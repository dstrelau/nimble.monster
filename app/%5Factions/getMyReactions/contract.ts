import { defineRoute } from "@/lib/contract";
import type { ReactableEntityType } from "@/lib/db/schema";
import type { ReactionsSummary } from "@/lib/services/reactions";

interface GetMyReactionsInput {
  entityType: ReactableEntityType;
  entityId: string;
}

export const getMyReactions = defineRoute<
  GetMyReactionsInput,
  ReactionsSummary
>({
  method: "GET",
  path: (input) =>
    `/_actions/getMyReactions?${new URLSearchParams({
      entityType: input.entityType,
      entityId: input.entityId,
    })}`,
});
