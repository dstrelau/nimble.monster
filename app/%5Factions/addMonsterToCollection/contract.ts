import { defineRoute } from "@/lib/contract";

export const addMonsterToCollection = defineRoute<
  { monsterId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addMonsterToCollection",
});
