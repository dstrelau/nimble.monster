"use server";

import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";

export async function dismissBanner() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  const db = getDatabase();
  await db
    .update(users)
    .set({ bannerDismissed: true })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
