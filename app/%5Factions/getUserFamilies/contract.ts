import { defineRoute } from "@/lib/contract";
import type { FamilyOverview } from "@/lib/types";

export const getUserFamilies = defineRoute<void, FamilyOverview[]>({
  method: "GET",
  path: () => "/_actions/getUserFamilies",
});
