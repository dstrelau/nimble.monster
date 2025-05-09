"use server";

import * as db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function deleteMonster(monsterId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await db.deleteMonster({
    id: monsterId,
    discordId: session.user.id,
  });

  if (deleted) {
    revalidatePath("/my/monsters");
    return { success: true, error: null };
  } else {
    return {
      success: false,
      error: "Could not delete the monster. Please try again.",
    };
  }
}
