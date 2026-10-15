import { defineRoute } from "@/lib/contract";

export const deleteClass = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteClass",
});
