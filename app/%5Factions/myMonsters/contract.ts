import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type {
  PaginateMonstersParams,
  PaginatePublicMonstersResponse,
} from "@/lib/services/monsters/service";

export const myMonsters = defineRoute<
  Omit<PaginateMonstersParams, "creatorId">,
  Jsonify<PaginatePublicMonstersResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) query.set(key, String(value));
    }
    return `/_actions/myMonsters?${query}`;
  },
});
