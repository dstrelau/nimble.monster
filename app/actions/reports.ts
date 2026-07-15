"use server";

import { auth } from "@/lib/auth";
import type { ReactableEntityType, ReportReason } from "@/lib/db/schema";
import { createReport, hasUserReported } from "@/lib/services/reports";

export async function getMyReport(
  entityType: ReactableEntityType,
  entityId: string
): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) {
    return false;
  }
  return hasUserReported(entityType, entityId, session.user.id);
}

export async function reportEntity(
  entityType: ReactableEntityType,
  entityId: string,
  reason: ReportReason,
  details: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }
  await createReport(entityType, entityId, session.user.id, reason, details);
  return { success: true };
}
