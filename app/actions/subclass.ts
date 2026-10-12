"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function searchPublicSubclasses(params: {
  creatorId?: string;
  searchTerm?: string;
  className?: string;
  sortBy?: "name" | "className";
  sortDirection?: "asc" | "desc";
  limit?: number;
}) {
  try {
    const subclasses = await db.searchPublicSubclassMinis(params);
    return { success: true, subclasses };
  } catch (error) {
    console.error("Error searching public subclasses:", error);
    return { success: false, error: "Failed to search subclasses" };
  }
}

export async function findPublicSubclass(subclassId: string) {
  try {
    const subclass = await db.findPublicSubclassById(subclassId);
    if (!subclass) {
      return { success: false, error: "Subclass not found", subclass: null };
    }

    return { success: true, error: null, subclass };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      subclass: null,
    };
  }
}

export async function deleteSubclass(subclassId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await db.deleteSubclass({
    id: subclassId,
    discordId: session.user.discordId,
  });

  if (deleted) {
    revalidatePath("/my/subclasses");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the subclass. Please try again.",
  };
}

export async function listPublicSubclassesAction() {
  return db.listPublicSubclasses();
}
