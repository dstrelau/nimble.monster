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
import { getEncounterUrl } from "@/lib/utils/url";

const encounterMonsterSchema = z.object({
  monsterId: z.uuid(),
  quantity: z.coerce.number().int().min(1),
  isPerHero: z.boolean(),
});

const encounterSchema = z.object({
  name: z.string().min(1, "Encounter name is required"),
  visibility: z.enum(ValidCollectionVisibilities),
  description: z.string().optional(),
  heroCount: z.coerce.number().int().min(1, "Hero count must be at least 1"),
  heroLevel: z.coerce
    .number()
    .int()
    .min(1, "Hero level must be at least 1")
    .max(20, "Hero level must be at most 20"),
  monsters: encounterMonsterSchema.array(),
});

export type EncounterFormData = z.infer<typeof encounterSchema>;

export async function updateEncounter(
  encounterId: string,
  formData: FormData
): Promise<{ success: boolean }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const safeJsonParse = (value: FormDataEntryValue | null): unknown => {
    try {
      return JSON.parse(value?.toString() || "[]");
    } catch {
      return [];
    }
  };

  const parsed = encounterSchema.parse({
    name: formData.get("name"),
    visibility: formData.get("visibility"),
    description: formData.get("description") || "",
    heroCount: formData.get("heroCount"),
    heroLevel: formData.get("heroLevel"),
    monsters: safeJsonParse(formData.get("monsters")),
  });

  const updatedEncounter = await db.updateEncounter({
    id: encounterId,
    name: parsed.name,
    visibility: parsed.visibility as CollectionVisibilityType,
    description: parsed.description,
    heroCount: parsed.heroCount,
    heroLevel: parsed.heroLevel,
    discordId: session.user.discordId,
    monsters: parsed.monsters,
  });

  if (!updatedEncounter) throw new Error("Failed to update encounter");

  revalidatePath("/my/encounters");
  revalidatePath(getEncounterUrl(updatedEncounter));

  if (formData.get("exit") === "true") {
    redirect("/my/encounters");
  }

  redirect(getEncounterUrl(updatedEncounter));

  return {
    success: true,
  };
}
