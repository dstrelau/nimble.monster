import {
  listOwnEncounters,
  type OwnEncountersResponse,
} from "@/app/%5Factions/listOwnEncounters/contract";
import { call } from "@/lib/contract";

export function ownEncountersQueryOptions(userId: string | undefined) {
  return {
    queryKey: ["listOwnEncounters", userId],
    enabled: Boolean(userId),
    queryFn: async ({
      signal,
    }: {
      signal: AbortSignal;
    }): Promise<OwnEncountersResponse> => {
      const response = await call(listOwnEncounters, undefined, { signal });
      return {
        ...response,
        encounters: response.encounters.map((encounter) => ({
          ...encounter,
          createdAt: encounter.createdAt
            ? new Date(encounter.createdAt)
            : undefined,
          monsters: encounter.monsters.map((entry) => ({
            ...entry,
            monster: {
              ...entry.monster,
              createdAt: new Date(entry.monster.createdAt),
            },
          })),
        })),
      };
    },
  };
}
