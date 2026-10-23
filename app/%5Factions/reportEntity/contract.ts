import { defineRoute } from "@/lib/contract";
import type { ReactableEntityType, ReportReason } from "@/lib/db/schema";

interface ReportEntityInput {
  entityType: ReactableEntityType;
  entityId: string;
  reason: ReportReason;
  details: string;
}

export const reportEntity = defineRoute<ReportEntityInput, { success: true }>({
  method: "POST",
  path: () => "/_actions/reportEntity",
});
