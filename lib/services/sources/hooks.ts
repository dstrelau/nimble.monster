import { useQuery } from "@tanstack/react-query";
import { getAllSources } from "./actions";

export function sourcesQueryOptions() {
  return {
    queryKey: ["sources"],
    queryFn: async () => {
      return await getAllSources();
    },
    staleTime: 300000,
  };
}

export function useSourcesQuery() {
  return useQuery(sourcesQueryOptions());
}
