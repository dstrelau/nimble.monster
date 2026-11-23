import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { RandomTableMini } from "@/lib/types";

export const publicRandomTables = defineRoute<
  undefined,
  { data: Jsonify<RandomTableMini>[] }
>({
  method: "GET",
  path: () => "/_actions/publicRandomTables",
});
