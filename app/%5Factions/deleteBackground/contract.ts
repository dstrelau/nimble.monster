import { defineRoute } from "@/lib/contract";

export const deleteBackground = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteBackground",
});
