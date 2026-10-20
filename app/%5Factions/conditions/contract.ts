import type { ConditionUsage } from "@/lib/conditions";
import { defineRoute } from "@/lib/contract";

export const loadConditionUsage = defineRoute<{ id: string }, ConditionUsage>({
  method: "GET",
  path: ({ id }) => `/_actions/conditions?id=${encodeURIComponent(id)}`,
});

export const updateCondition = defineRoute<
  { id: string; description: string },
  { success: true }
>({
  method: "PATCH",
  path: () => "/_actions/conditions",
});
