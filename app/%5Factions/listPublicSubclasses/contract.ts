import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { Subclass } from "@/lib/types";

export const listPublicSubclasses = defineRoute<void, Jsonify<Subclass>[]>({
  method: "GET",
  path: () => "/_actions/listPublicSubclasses",
});
