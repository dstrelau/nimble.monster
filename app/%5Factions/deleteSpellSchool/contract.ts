import { defineRoute } from "@/lib/contract";

export const deleteSpellSchool = defineRoute<{ id: string }, { success: true }>(
  {
    method: "POST",
    path: () => "/_actions/deleteSpellSchool",
  }
);
