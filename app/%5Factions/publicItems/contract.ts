import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { PublicItemPageResponse } from "@/lib/services/items/service";

interface PublicItemsInput {
  sort?: string;
  rarity?: string;
  search?: string | null;
  source?: string;
  creatorId?: string;
  limit?: number;
  pageParam?: number;
}

export const publicItems = defineRoute<
  PublicItemsInput,
  Jsonify<PublicItemPageResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && value !== null) query.set(key, String(value));
    }
    return `/_actions/publicItems?${query}`;
  },
});
