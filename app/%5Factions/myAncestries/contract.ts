import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type {
  PaginateAncestriesParams,
  PaginatePublicAncestriesResponse,
} from "@/lib/services/ancestries/service";

export type MyAncestriesInput = Omit<PaginateAncestriesParams, "creatorId">;
export type MyAncestriesResponse = Jsonify<PaginatePublicAncestriesResponse>;

export const myAncestries = defineRoute<
  MyAncestriesInput,
  MyAncestriesResponse
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) query.set(key, String(value));
    }
    return `/_actions/myAncestries?${query}`;
  },
});
