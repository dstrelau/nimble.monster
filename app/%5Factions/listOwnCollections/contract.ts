import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { CollectionOverview } from "@/lib/types";

export interface OwnCollectionsResponse {
  success: boolean;
  collections: CollectionOverview[];
}

export const listOwnCollections = defineRoute<
  void,
  Jsonify<OwnCollectionsResponse>
>({
  method: "GET",
  path: () => "/_actions/listOwnCollections",
});
