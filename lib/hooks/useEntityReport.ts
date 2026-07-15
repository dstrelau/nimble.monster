"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyReport, reportEntity } from "@/app/actions/reports";
import type { ReactableEntityType, ReportReason } from "@/lib/db/schema";

export function useEntityReport(
  entityType: ReactableEntityType,
  entityId: string
) {
  const queryClient = useQueryClient();
  const queryKey = ["report", entityType, entityId] as const;

  const query = useQuery({
    queryKey,
    queryFn: () => getMyReport(entityType, entityId),
  });

  const mutation = useMutation({
    mutationFn: ({
      reason,
      details,
    }: {
      reason: ReportReason;
      details: string;
    }) => reportEntity(entityType, entityId, reason, details),
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
