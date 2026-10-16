import { defineRoute } from "@/lib/contract";

export const deleteCompanion = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteCompanion",
});
