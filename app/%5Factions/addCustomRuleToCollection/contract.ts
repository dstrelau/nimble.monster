import { defineRoute } from "@/lib/contract";

export const addCustomRuleToCollection = defineRoute<
  { customRuleId: string; collectionId: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addCustomRuleToCollection",
});
