import { getMyReactions } from "@/app/actions/reactions";
import type { ReactableEntityType } from "@/lib/db/schema";

export function entityReactionsQueryOptions(
  entityType: ReactableEntityType,
  entityId: string
) {
  return {
    queryKey: ["reactions", entityType, entityId],
    queryFn: () => getMyReactions(entityType, entityId),
  };
}
