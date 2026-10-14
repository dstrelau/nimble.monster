"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { deleteCustomRule } from "@/lib/db/custom-rule";

export async function deleteCustomRuleAction(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const deleted = await deleteCustomRule(id, session.user.id);
    revalidatePath("/custom-rules");
    return {
      success: deleted,
      error: deleted ? null : "Failed to delete custom rule",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
