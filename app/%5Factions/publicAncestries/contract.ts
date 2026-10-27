import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type {
  PaginateAncestriesParams,
  PaginatePublicAncestriesResponse,
} from "@/lib/services/ancestries/service";

export const publicAncestries = defineRoute<
  PaginateAncestriesParams,
  Jsonify<PaginatePublicAncestriesResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) query.set(key, String(value));
    }
    return `/_actions/publicAncestries?${query}`;
  },
});
