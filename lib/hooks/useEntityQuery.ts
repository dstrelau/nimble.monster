import { useQuery } from "@tanstack/react-query";
import { getEntityById } from "@/lib/actions/entities";
import type { EntityReference, EntityType } from "@/lib/types/entity-links";

export function useEntityQuery(type: EntityType, id: string) {
  return useQuery<EntityReference | null>({
    queryKey: ["entity", type, id],
    queryFn: async () => {
      return await getEntityById(type, id);
    },
    staleTime: 60000,
  });
}
