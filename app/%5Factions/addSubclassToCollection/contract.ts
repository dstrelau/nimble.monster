import { defineRoute } from "@/lib/contract";

export const addSubclassToCollection = defineRoute<
  { subclassId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addSubclassToCollection",
});
