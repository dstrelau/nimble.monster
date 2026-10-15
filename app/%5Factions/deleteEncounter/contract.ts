import { defineRoute } from "@/lib/contract";

export const deleteEncounter = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteEncounter",
});
