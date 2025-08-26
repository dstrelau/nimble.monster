"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export async function createItem(formData: {
  name: string;
  kind?: string;
  description: string;
  moreInfo?: string;
  imageIcon?: string;
  visibility: "public" | "private";
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const item = await db.createItem({
      ...formData,
      discordId: session.user.id,
    });

    revalidatePath("/my/items");

    return { success: true, item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function updateItem(
  itemId: string,
  formData: {
    name: string;
    kind?: string;
    description: string;
    moreInfo?: string;
    imageIcon?: string;
    visibility: "public" | "private";
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const item = await db.updateItem({
      id: itemId,
      ...formData,
      discordId: session.user.id,
    });

    revalidatePath(`/items/${itemId}`);
    revalidatePath("/my/items");

    return { success: true, item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deleteItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const deleted = await db.deleteItem({
    id: itemId,
    discordId: session.user.id,
  });

  if (deleted) {
    revalidatePath("/my/items");
    return { success: true, error: null };
  }
  return {
    success: false,
    error: "Could not delete the item. Please try again.",
  };
}
