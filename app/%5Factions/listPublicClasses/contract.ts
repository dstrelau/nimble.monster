import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { Class } from "@/lib/types";

export const listPublicClasses = defineRoute<void, Jsonify<Class>[]>({
  method: "GET",
  path: () => "/_actions/listPublicClasses",
});
