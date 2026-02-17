"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import type {
  SubclassClass,
  SubclassLevel,
  SubclassVisibility,
} from "@/lib/types";
import { getSubclassUrl } from "@/lib/utils/url";

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

export async function createSubclass(formData: {
  name: string;
  className: SubclassClass;
  namePreface?: string;
  tagline?: string;
  description?: string;
  levels: SubclassLevel[];
  visibility: SubclassVisibility;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const subclass = await db.createSubclass({
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath("/my/subclasses");

    return { success: true, subclass };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateSubclass(
  subclassId: string,
  formData: {
    name: string;
    className: SubclassClass;
    namePreface?: string;
    tagline?: string;
    description?: string;
    levels: SubclassLevel[];
    visibility: SubclassVisibility;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const subclass = await db.updateSubclass({
      id: subclassId,
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath(getSubclassUrl(subclass));
    revalidatePath("/my/subclasses");

    return { success: true, subclass };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
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
