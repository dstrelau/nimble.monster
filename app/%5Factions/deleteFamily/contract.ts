import { defineRoute } from "@/lib/contract";

export const deleteFamily = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteFamily",
});
