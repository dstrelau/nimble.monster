import { defineRoute } from "@/lib/contract";
import type { Condition } from "@/lib/types";

export const loadOfficialConditions = defineRoute<void, Condition[]>({
  method: "GET",
  path: () => "/_actions/loadOfficialConditions",
});
