import { defineRoute } from "@/lib/contract";
import type { EntityType, SourceOption } from "@/lib/services/sources/types";

export const getSourcesForEntityType = defineRoute<
  { entityType: EntityType },
  SourceOption[]
>({
  method: "GET",
  path: ({ entityType }) =>
    `/_actions/getSourcesForEntityType?${new URLSearchParams({ entityType })}`,
});
