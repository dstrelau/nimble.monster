import { useQuery } from "@tanstack/react-query";
import { listAllMonsterSources } from "./actions";

export function monsterSourcesQueryOptions(props?: { enabled?: boolean }) {
  return {
    ...props,
    queryKey: ["monster-sources"],
    queryFn: async () => {
      return await listAllMonsterSources();
    },
    staleTime: 60000,
  };
}

export function useMonsterSourcesQuery(props?: { enabled?: boolean }) {
  return useQuery(monsterSourcesQueryOptions(props));
}
