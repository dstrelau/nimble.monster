import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { EncounterOverview } from "@/lib/types";

export interface OwnEncountersResponse {
  success: boolean;
  encounters: EncounterOverview[];
}

export const listOwnEncounters = defineRoute<
  void,
  Jsonify<OwnEncountersResponse>
>({
  method: "GET",
  path: () => "/_actions/listOwnEncounters",
});
