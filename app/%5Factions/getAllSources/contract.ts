import { defineRoute } from "@/lib/contract";
import type { SourceOption } from "@/lib/services/sources/types";

export const getAllSources = defineRoute<void, SourceOption[]>({
  method: "GET",
  path: () => "/_actions/getAllSources",
});
