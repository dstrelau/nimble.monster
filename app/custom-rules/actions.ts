"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  type CustomRule,
  type CustomRuleReverseGroups,
  type CustomRuleSectionLink,
  createCustomRule,
  deleteCustomRule,
  listPublicCustomRulesForSections,
  updateCustomRule,
} from "@/lib/db/custom-rule";
import type { CustomRuleVisibility } from "@/lib/db/schema";

interface CustomRuleFormData {
  name: string;
  content: string;
  visibility: CustomRuleVisibility;
  links: CustomRuleSectionLink[];
}

type ActionResult =
  | { success: true; rule: CustomRule }
  | { success: false; error: string };

// Fetched at runtime by the reference page's reverse-view client component so
// the statically generated page picks up live custom-rule data on hydration.
export async function getPublicCustomRulesForSections(
  sectionSlugs: string[]
): Promise<CustomRuleReverseGroups> {
  return listPublicCustomRulesForSections(sectionSlugs);
}

export async function createCustomRuleAction(
  data: CustomRuleFormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const rule = await createCustomRule({
      userId: session.user.id,
      name: data.name,
      content: data.content,
      visibility: data.visibility,
      links: data.links,
    });
    revalidatePath("/custom-rules");
    return { success: true, rule };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateCustomRuleAction(
  id: string,
  data: CustomRuleFormData
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const rule = await updateCustomRule({
      id,
      userId: session.user.id,
      name: data.name,
      content: data.content,
      visibility: data.visibility,
      links: data.links,
    });
    revalidatePath("/custom-rules");
    revalidatePath(`/custom-rules/${id}`);
    return { success: true, rule };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

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
