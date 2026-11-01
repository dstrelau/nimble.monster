import {
  listOwnCollections,
  type OwnCollectionsResponse,
} from "@/app/%5Factions/listOwnCollections/contract";
import { call } from "@/lib/contract";
import { reviveCollectionOverview } from "./serialization";

export function ownCollectionsQueryOptions(userId: string | undefined) {
  return {
    queryKey: ["listOwnCollections", userId],
    enabled: Boolean(userId),
    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<OwnCollectionsResponse> => {
      const response = await call(listOwnCollections, undefined, { signal });
      return {
        ...response,
        collections: response.collections.map(reviveCollectionOverview),
      };
    },
  };
}
