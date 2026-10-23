"use server";

import { auth } from "@/lib/auth";
import type { ReactableEntityType } from "@/lib/db/schema";
import { hasUserReported } from "@/lib/services/reports";

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
