"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  deleteAncestry as deleteAncestryRepo,
  findAncestry,
} from "@/lib/services/ancestries";

export async function findPublicAncestry(ancestryId: string) {
  try {
    const ancestry = await findAncestry(ancestryId);
    if (!ancestry || ancestry.visibility !== "public") {
      return { success: false, error: "Ancestry not found", ancestry: null };
    }

    return { success: true, error: null, ancestry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      ancestry: null,
    };
  }
}

export async function deleteAncestry(ancestryId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await deleteAncestryRepo(ancestryId, session.user.discordId);

  if (deleted) {
    revalidatePath("/ancestries");
    revalidatePath("/my/ancestries");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the ancestry. Please try again.",
  };
}
