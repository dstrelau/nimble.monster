"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  deleteBackground as deleteBackgroundRepo,
  findBackground,
} from "@/lib/services/backgrounds";

export async function findPublicBackground(backgroundId: string) {
  try {
    const background = await findBackground(backgroundId);
    if (!background) {
      return {
        success: false,
        error: "Background not found",
        background: null,
      };
    }

    return { success: true, error: null, background };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      background: null,
    };
  }
}

export async function deleteBackground(backgroundId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await deleteBackgroundRepo(
    backgroundId,
    session.user.discordId
  );

  if (deleted) {
    revalidatePath("/my/backgrounds");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the background. Please try again.",
  };
}
