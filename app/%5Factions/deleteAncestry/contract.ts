import { defineRoute } from "@/lib/contract";

export const deleteAncestry = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteAncestry",
});
