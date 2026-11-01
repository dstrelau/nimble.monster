import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { PublicCollectionPageResponse } from "@/lib/services/collections/service";

interface PublicCollectionsInput {
  sort?: string;
  search?: string | null;
  limit?: number;
  pageParam?: number;
}

export const publicCollections = defineRoute<
  PublicCollectionsInput,
  Jsonify<PublicCollectionPageResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined && value !== null) query.set(key, String(value));
    }
    return `/_actions/publicCollections?${query}`;
  },
});
