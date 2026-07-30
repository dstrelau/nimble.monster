import { listOwnCollections } from "@/app/actions/collection";

export function ownCollectionsQueryOptions() {
  return {
    queryKey: ["listOwnCollections"],
    queryFn: listOwnCollections,
  };
}
