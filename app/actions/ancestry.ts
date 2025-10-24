"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type {
  AncestryAbility,
  AncestryRarity,
  AncestrySize,
} from "@/lib/services/ancestries";
import {
  createAncestry as createAncestryRepo,
  deleteAncestry as deleteAncestryRepo,
  findAncestry,
  updateAncestry as updateAncestryRepo,
} from "@/lib/services/ancestries";

export async function createAncestry(formData: {
  name: string;
  description: string;
  size: AncestrySize[];
  rarity: AncestryRarity;
  abilities: AncestryAbility[];
  sourceId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const ancestry = await createAncestryRepo(formData, session.user.discordId);

    revalidatePath("/my/ancestries");

    return { success: true, ancestry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateAncestry(
  ancestryId: string,
  formData: {
    name: string;
    description: string;
    size: AncestrySize[];
    rarity: AncestryRarity;
    abilities: AncestryAbility[];
    sourceId?: string;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const ancestry = await updateAncestryRepo(
      ancestryId,
      formData,
      session.user.discordId
    );

    revalidatePath(`/ancestries/${ancestry.id}`);
    revalidatePath("/my/ancestries");

    return { success: true, ancestry };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function findPublicAncestry(ancestryId: string) {
  try {
    const ancestry = await findAncestry(ancestryId);
    if (!ancestry) {
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
    revalidatePath("/my/ancestries");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the ancestry. Please try again.",
  };
}
