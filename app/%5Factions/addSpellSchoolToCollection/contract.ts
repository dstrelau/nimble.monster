import { defineRoute } from "@/lib/contract";

export const addSpellSchoolToCollection = defineRoute<
  { spellSchoolId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addSpellSchoolToCollection",
});
