import { useQuery } from "@tanstack/react-query";
import { sourcesQueryOptions } from "@/lib/services/sources/hooks";

export function useSourcesQuery(props?: { enabled?: boolean }) {
  return useQuery({
    ...sourcesQueryOptions(),
    ...props,
    staleTime: 60000,
  });
}
