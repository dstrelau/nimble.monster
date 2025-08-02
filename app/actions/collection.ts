"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import type { CollectionOverview, CollectionVisibilityType } from "@/lib/types";

export async function deleteCollection(collectionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const deleted = await db.deleteCollection({
      id: collectionId,
      discordId: session.user.id,
    });

    if (deleted) {
      revalidatePath("/my/collections");
      return { success: true, error: null };
    }
    return {
      success: false,
      error: "Could not delete the collection. Please try again.",
    };
  } catch (error) {
    console.error("Error deleting collection:", error);

    // Handle specific database errors
    const errorMessage = error instanceof Error ? error.message : "";

    if (errorMessage.includes("foreign key constraint")) {
      return {
        success: false,
        error:
          "Cannot delete this collection because it has monsters associated with it.",
      };
    }

    return {
      success: false,
      error:
        "An error occurred while deleting the collection. Please try again later.",
    };
  }
}

export async function createCollection(formData: {
  name: string;
  visibility: CollectionVisibilityType;
  description?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const collection = await db.createCollection({
      name: formData.name,
      visibility: formData.visibility,
      description: formData.description,
      discordId: session.user.id,
    });

    // Revalidate the collections page to force a refresh
    revalidatePath("/my/collections");

    return { success: true, collection: collection as CollectionOverview };
  } catch (error) {
    console.error("Error creating collection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateCollection(
  collectionId: string,
  formData: {
    name: string;
    visibility: CollectionVisibilityType;
    description?: string;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const collection = await db.updateCollection({
      id: collectionId,
      name: formData.name,
      visibility: formData.visibility,
      description: formData.description,
      discordId: session.user.id,
    });

    if (!collection) {
      return {
        success: false,
        error: "Collection not found or you don't have permission to update it",
      };
    }

    // Revalidate the collections page to force a refresh
    revalidatePath("/my/collections");

    return { success: true, collection };
  } catch (error) {
    console.error("Error updating collection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
