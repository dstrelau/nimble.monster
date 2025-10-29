"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import type {
  ArmorType,
  ClassLevel,
  ClassVisibility,
  HitDieSize,
  StatType,
  WeaponSpec,
} from "@/lib/types";
import { getClassUrl } from "@/lib/utils/url";

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

export async function createClass(formData: {
  name: string;
  description: string;
  keyStats: StatType[];
  hitDie: HitDieSize;
  startingHp: number;
  saves: Record<StatType, number>;
  armor: ArmorType[];
  weapons: WeaponSpec;
  startingGear: string[];
  levels: ClassLevel[];
  abilityListIds: string[];
  visibility: ClassVisibility;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const classEntity = await db.createClass({
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath("/my/classes");

    return { success: true, class: classEntity };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateClass(
  classId: string,
  formData: {
    name: string;
    description: string;
    keyStats: StatType[];
    hitDie: HitDieSize;
    startingHp: number;
    saves: Record<StatType, number>;
    armor: ArmorType[];
    weapons: WeaponSpec;
    startingGear: string[];
    levels: ClassLevel[];
    abilityListIds: string[];
    visibility: ClassVisibility;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const classEntity = await db.updateClass({
      id: classId,
      ...formData,
      discordId: session.user.discordId,
    });

    revalidatePath(getClassUrl(classEntity));
    revalidatePath("/my/classes");

    return { success: true, class: classEntity };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
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

export async function deleteClass(classId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await db.deleteClass({
    id: classId,
    discordId: session.user.discordId,
  });

  if (deleted) {
    revalidatePath("/my/classes");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the class. Please try again.",
  };
}
