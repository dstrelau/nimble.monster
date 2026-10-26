import { getMyReactions } from "@/app/%5Factions/getMyReactions/contract";
import { call } from "@/lib/contract";
import type { ReactableEntityType } from "@/lib/db/schema";

export function entityReactionsQueryOptions(
  entityType: ReactableEntityType,
  entityId: string,
  userId: string | undefined
) {
  return {
    queryKey: ["reactions", entityType, entityId, userId],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(getMyReactions, { entityType, entityId }, { signal }),
  };
}
