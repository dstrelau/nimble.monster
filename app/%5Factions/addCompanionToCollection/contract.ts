import { defineRoute } from "@/lib/contract";

export const addCompanionToCollection = defineRoute<
  { companionId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addCompanionToCollection",
});
