import { listOwnEncounters } from "@/app/actions/encounter";

export function ownEncountersQueryOptions() {
  return {
    queryKey: ["listOwnEncounters"],
    queryFn: listOwnEncounters,
  };
}
