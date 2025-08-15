import { useQuery } from "@tanstack/react-query";
import {
  loadOfficialConditions,
  loadOwnConditions,
} from "@/app/actions/conditions";
import type { Condition } from "@/lib/types";

interface UseConditionsOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useConditions({
  enabled = true,
  staleTime = 60 * 1000,
}: UseConditionsOptions = {}) {
  const ownConds = useQuery({
    queryKey: ["own-conditions"],
    queryFn: loadOwnConditions,
    staleTime,
    enabled,
  });

  const officialConds = useQuery({
    queryKey: ["official-conditions"],
    queryFn: loadOfficialConditions,
    staleTime,
    enabled,
  });

  const isLoading = ownConds.isLoading || officialConds.isLoading;
  const allConditions: Condition[] = [
    ...(ownConds?.data ?? []),
    ...(officialConds?.data ?? []),
  ];

  return {
    ownConds,
    officialConds,
    allConditions,
    isLoading,
  };
}
