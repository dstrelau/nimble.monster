import { defineRoute } from "@/lib/contract";
import type { AllNavCounts } from "@/lib/db/nav";

export const getNavCounts = defineRoute<void, AllNavCounts>({
  method: "GET",
  path: () => "/_actions/getNavCounts",
});
