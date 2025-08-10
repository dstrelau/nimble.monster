"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import {
  type CollectionVisibilityType,
  ValidCollectionVisibilities,
} from "@/lib/types";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(ValidCollectionVisibilities),
  description: z.string().optional(),
  monsterIds: z.string().array(),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;

export async function updateCollection(
  collectionId: string,
  formData: FormData
): Promise<{ success: boolean; monsterIds: string[] }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Parse form data
  const parsed = collectionSchema.parse({
    name: formData.get("name"),
    visibility: formData.get("visibility"),
    description: formData.get("description") || "",
    monsterIds: JSON.parse(formData.get("monsterIds")?.toString() || "[]"),
  });

  // Use the new db function to update the collection
  const updatedCollection = await db.updateCollection({
    id: collectionId,
    name: parsed.name,
    visibility: parsed.visibility as CollectionVisibilityType,
    description: parsed.description,
    discordId: session.user.id,
    monsterIds: parsed.monsterIds,
  });

  if (!updatedCollection) throw new Error("Failed to update collection");

  revalidatePath("/my/collections");

  // Check if "exit" parameter was provided
  if (formData.get("exit") === "true") {
    redirect("/my/collections");
  }

  return {
    success: true,
    monsterIds: parsed.monsterIds,
  };
}
