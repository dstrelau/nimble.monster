import { defineRoute } from "@/lib/contract";

export const addAncestryToCollection = defineRoute<
  { ancestryId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addAncestryToCollection",
});
