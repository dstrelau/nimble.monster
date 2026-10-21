import { defineRoute } from "@/lib/contract";

export const addBackgroundToCollection = defineRoute<
  { backgroundId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addBackgroundToCollection",
});
