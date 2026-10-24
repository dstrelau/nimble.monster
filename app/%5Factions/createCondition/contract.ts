import { defineRoute } from "@/lib/contract";

export const createCondition = defineRoute<
  { name: string; description: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/createCondition",
});
