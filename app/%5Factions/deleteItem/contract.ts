import { defineRoute } from "@/lib/contract";

export const deleteItem = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteItem",
});
