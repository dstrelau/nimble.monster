import { defineRoute } from "@/lib/contract";

export const addItemToCollection = defineRoute<
  { itemId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addItemToCollection",
});
