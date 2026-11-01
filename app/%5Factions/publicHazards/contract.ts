import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type {
  PaginateHazardsParams,
  PaginateHazardsResponse,
} from "@/lib/services/hazards";

export const publicHazards = defineRoute<
  PaginateHazardsParams,
  Jsonify<PaginateHazardsResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) query.set(key, String(value));
    }
    return `/_actions/publicHazards?${query}`;
  },
});
