import { useQuery } from "@tanstack/react-query";
import { getAllSources, getSourcesForEntityType } from "./actions";
import type { EntityType } from "./types";

export function sourcesQueryOptions() {
  return {
    queryKey: ["sources"],
    queryFn: async () => {
      return await getAllSources();
    },
    staleTime: 300000,
  };
}

export function useSourcesQuery(opts?: { enabled?: boolean }) {
  return useQuery({ ...sourcesQueryOptions(), ...opts });
}

export function sourcesForEntityTypeQueryOptions(entityType: EntityType) {
  return {
    queryKey: ["sources", entityType],
    queryFn: async () => {
      return await getSourcesForEntityType(entityType);
    },
    staleTime: 300000,
  };
}

export function useSourcesForEntityTypeQuery(
  entityType: EntityType,
  opts?: { enabled?: boolean }
) {
  return useQuery({ ...sourcesForEntityTypeQueryOptions(entityType), ...opts });
}
