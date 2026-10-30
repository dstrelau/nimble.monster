import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type {
  PaginateMonstersParams,
  PaginatePublicCompanionsResponse,
} from "@/lib/services/companions/types";

export const publicCompanions = defineRoute<
  PaginateMonstersParams,
  Jsonify<PaginatePublicCompanionsResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) query.set(key, String(value));
    }
    return `/_actions/publicCompanions?${query}`;
  },
});
