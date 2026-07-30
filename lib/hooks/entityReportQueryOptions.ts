import { getMyReport } from "@/app/actions/reports";
import type { ReactableEntityType } from "@/lib/db/schema";

export function entityReportQueryOptions(
  entityType: ReactableEntityType,
  entityId: string
) {
  return {
    queryKey: ["report", entityType, entityId],
    queryFn: () => getMyReport(entityType, entityId),
  };
}
