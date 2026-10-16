import { defineRoute } from "@/lib/contract";

export const deleteSubclass = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteSubclass",
});
