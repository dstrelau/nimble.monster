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
import { getCollectionUrl } from "@/lib/utils/url";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(ValidCollectionVisibilities),
  description: z.string().optional(),
  monsterIds: z.string().array(),
  itemIds: z.string().array().optional(),
  companionIds: z.string().array().optional(),
  ancestryIds: z.string().array().optional(),
  backgroundIds: z.string().array().optional(),
  subclassIds: z.string().array().optional(),
  spellSchoolIds: z.string().array().optional(),
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
    itemIds: JSON.parse(formData.get("itemIds")?.toString() || "[]"),
    companionIds: JSON.parse(formData.get("companionIds")?.toString() || "[]"),
    ancestryIds: JSON.parse(formData.get("ancestryIds")?.toString() || "[]"),
    backgroundIds: JSON.parse(
      formData.get("backgroundIds")?.toString() || "[]"
    ),
    subclassIds: JSON.parse(formData.get("subclassIds")?.toString() || "[]"),
    spellSchoolIds: JSON.parse(
      formData.get("spellSchoolIds")?.toString() || "[]"
    ),
  });

  // Use the new db function to update the collection
  const updatedCollection = await db.updateCollection({
    id: collectionId,
    name: parsed.name,
    visibility: parsed.visibility as CollectionVisibilityType,
    description: parsed.description,
    discordId: session.user.discordId,
    monsterIds: parsed.monsterIds,
    itemIds: parsed.itemIds,
    companionIds: parsed.companionIds,
    ancestryIds: parsed.ancestryIds,
    backgroundIds: parsed.backgroundIds,
    subclassIds: parsed.subclassIds,
    spellSchoolIds: parsed.spellSchoolIds,
  });

  if (!updatedCollection) throw new Error("Failed to update collection");

  revalidatePath("/my/collections");
  revalidatePath(getCollectionUrl(updatedCollection));

  // Check if "exit" parameter was provided
  if (formData.get("exit") === "true") {
    redirect("/my/collections");
  }

  // Redirect to collection detail page after successful save
  redirect(getCollectionUrl(updatedCollection));

  return {
    success: true,
    monsterIds: parsed.monsterIds,
  };
}
