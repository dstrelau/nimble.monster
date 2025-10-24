import { useQuery } from "@tanstack/react-query";
import { getAllSources } from "@/lib/services/sources/actions";

export function useSourcesQuery(props?: { enabled?: boolean }) {
  return useQuery({
    ...props,
    queryKey: ["sources"],
    queryFn: async () => {
      return await getAllSources();
    },
    staleTime: 60000,
  });
}
