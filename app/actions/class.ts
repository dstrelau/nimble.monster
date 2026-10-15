"use server";

import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function searchClassesForSubclass(searchTerm?: string) {
  const session = await auth();
  const classes = await db.searchClassesForSubclass({
    userId: session?.user?.id,
    searchTerm,
  });
  return classes;
}

export async function searchPublicClasses(params: {
  creatorId?: string;
  searchTerm?: string;
  sortBy?: "name";
  sortDirection?: "asc" | "desc";
  limit?: number;
}) {
  try {
    const classes = await db.searchPublicClassMinis(params);
    return { success: true, classes };
  } catch (error) {
    console.error("Error searching public classes:", error);
    return { success: false, error: "Failed to search classes" };
  }
}

export async function findPublicClass(classId: string) {
  try {
    const classEntity = await db.findPublicClassById(classId);
    if (!classEntity) {
      return { success: false, error: "Class not found", class: null };
    }

    return { success: true, error: null, class: classEntity };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      class: null,
    };
  }
}

export async function listPublicClassesAction() {
  return db.listPublicClasses();
}
