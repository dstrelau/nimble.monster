import { defineRoute } from "@/lib/contract";
import type { ReactableEntityType } from "@/lib/db/schema";

interface GetMyReportInput {
  entityType: ReactableEntityType;
  entityId: string;
}

export const getMyReport = defineRoute<GetMyReportInput, boolean>({
  method: "GET",
  path: (input) =>
    `/_actions/getMyReport?${new URLSearchParams({
      entityType: input.entityType,
      entityId: input.entityId,
    })}`,
});
