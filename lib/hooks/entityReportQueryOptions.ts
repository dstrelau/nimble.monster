import { getMyReport } from "@/app/%5Factions/getMyReport/contract";
import { call } from "@/lib/contract";
import type { ReactableEntityType } from "@/lib/db/schema";

export function entityReportQueryOptions(
  entityType: ReactableEntityType,
  entityId: string,
  userId: string | undefined
) {
  return {
    queryKey: ["report", entityType, entityId, userId],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(getMyReport, { entityType, entityId }, { signal }),
  };
}
