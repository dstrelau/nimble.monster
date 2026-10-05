import { defineRoute } from "@/lib/contract";
import type {
  EntityReference,
  EntityReferenceRequest,
} from "@/lib/types/entity-links";

export const entityReferences = defineRoute<
  EntityReferenceRequest[],
  { references: EntityReference[] }
>({
  method: "GET",
  path: (requests) => {
    const params = new URLSearchParams(
      requests.map(({ type, id }) => ["reference", `${type}:${id}`])
    );
    return `/_actions/entityReferences?${params}`;
  },
});
