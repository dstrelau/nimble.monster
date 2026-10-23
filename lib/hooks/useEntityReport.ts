"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportEntity } from "@/app/%5Factions/reportEntity/contract";
import { call } from "@/lib/contract";
import type { ReactableEntityType, ReportReason } from "@/lib/db/schema";
import { entityReportQueryOptions } from "./entityReportQueryOptions";

export function useEntityReport(
  entityType: ReactableEntityType,
  entityId: string
) {
  const queryClient = useQueryClient();
  const queryKey = ["report", entityType, entityId] as const;

  const query = useQuery(entityReportQueryOptions(entityType, entityId));

  const mutation = useMutation({
    mutationFn: ({
      reason,
      details,
    }: {
      reason: ReportReason;
      details: string;
    }) => call(reportEntity, { entityType, entityId, reason, details }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.setQueryData(queryKey, true);
      }
    },
  });

  return {
    hasReported: query.data ?? false,
    report: (reason: ReportReason, details: string) =>
      mutation.mutateAsync({ reason, details }),
    isReportPending: mutation.isPending,
  };
}
