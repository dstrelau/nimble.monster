"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { reportEntity } from "@/app/%5Factions/reportEntity/contract";
import { call } from "@/lib/contract";
import type { ReactableEntityType, ReportReason } from "@/lib/db/schema";
import { entityReportQueryOptions } from "./entityReportQueryOptions";

export function useEntityReport(
  entityType: ReactableEntityType,
  entityId: string
) {
  const { status, data: session } = useSession();
  const queryClient = useQueryClient();
  const options = entityReportQueryOptions(
    entityType,
    entityId,
    session?.user?.id
  );

  const query = useQuery({ ...options, enabled: status === "authenticated" });

  const mutation = useMutation({
    mutationFn: async ({
      reason,
      details,
    }: {
      reason: ReportReason;
      details: string;
    }) => {
      const queryKey = options.queryKey;
      const result = await call(reportEntity, {
        entityType,
        entityId,
        reason,
        details,
      });
      return { result, queryKey };
    },
    onSuccess: ({ result, queryKey }) => {
      if (result.success) {
        queryClient.setQueryData(queryKey, true);
      }
    },
  });

  return {
    hasReported: status === "authenticated" && (query.data ?? false),
    report: (reason: ReportReason, details: string) =>
      mutation.mutateAsync({ reason, details }),
    isReportPending: mutation.isPending,
  };
}
