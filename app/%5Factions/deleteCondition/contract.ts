import { defineRoute } from "@/lib/contract";

export const deleteCondition = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteCondition",
});
