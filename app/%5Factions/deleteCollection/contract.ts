import { defineRoute } from "@/lib/contract";

export const deleteCollection = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteCollection",
});
