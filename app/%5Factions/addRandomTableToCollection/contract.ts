import { defineRoute } from "@/lib/contract";

export const addRandomTableToCollection = defineRoute<
  { randomTableId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addRandomTableToCollection",
});
