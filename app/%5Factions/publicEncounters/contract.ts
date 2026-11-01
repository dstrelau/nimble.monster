import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type {
  PaginatedEncounterResponse,
  PublicEncountersParams,
} from "@/lib/services/encounters/pagination";

export const publicEncounters = defineRoute<
  PublicEncountersParams,
  Jsonify<PaginatedEncounterResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && value !== null) query.set(key, String(value));
    }
    return `/_actions/publicEncounters?${query}`;
  },
});
