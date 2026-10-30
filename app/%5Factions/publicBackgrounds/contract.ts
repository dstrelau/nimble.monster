import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type {
  PaginateBackgroundsParams,
  PaginatePublicBackgroundsResponse,
} from "@/lib/services/backgrounds/service";

export const publicBackgrounds = defineRoute<
  PaginateBackgroundsParams,
  Jsonify<PaginatePublicBackgroundsResponse>
>({
  method: "GET",
  path: (input) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) query.set(key, String(value));
    }
    return `/_actions/publicBackgrounds?${query}`;
  },
});
