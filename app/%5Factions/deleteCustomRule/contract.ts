import { defineRoute } from "@/lib/contract";

export const deleteCustomRule = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteCustomRule",
});
