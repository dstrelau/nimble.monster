import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import { defineRoute } from "@/lib/contract";
import type { CustomRuleMini } from "@/lib/db/custom-rule";

export const publicCustomRules = defineRoute<
  undefined,
  { data: Jsonify<CustomRuleMini>[] }
>({
  method: "GET",
  path: () => "/_actions/publicCustomRules",
});
