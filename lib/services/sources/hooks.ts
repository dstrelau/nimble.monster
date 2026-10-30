import { useQuery } from "@tanstack/react-query";
import { getAllSources } from "@/app/%5Factions/getAllSources/contract";
import { getSourcesForEntityType } from "@/app/%5Factions/getSourcesForEntityType/contract";
import { call } from "@/lib/contract";
import type { EntityType } from "./types";

export function sourcesQueryOptions() {
  return {
    queryKey: ["sources"],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(getAllSources, undefined, { signal }),
    staleTime: 300000,
  };
}

export function useSourcesQuery(opts?: { enabled?: boolean }) {
  return useQuery({ ...sourcesQueryOptions(), ...opts });
}

export function sourcesForEntityTypeQueryOptions(entityType: EntityType) {
  return {
    queryKey: ["sources", entityType],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      call(getSourcesForEntityType, { entityType }, { signal }),
    staleTime: 300000,
  };
}

export function useSourcesForEntityTypeQuery(
  entityType: EntityType,
  opts?: { enabled?: boolean }
) {
  return useQuery({ ...sourcesForEntityTypeQueryOptions(entityType), ...opts });
}
