"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import * as awardDb from "@/lib/db/award";

export async function createAwardAction(formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  const url = formData.get("url") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string;

  await awardDb.createAward({ name, abbreviation, url, color, icon });
  revalidatePath("/admin/awards");
  redirect("/admin/awards");
}

export async function updateAwardAction(id: string, formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  const url = formData.get("url") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string;

  await awardDb.updateAward(id, { name, abbreviation, url, color, icon });
  revalidatePath("/admin/awards");
  redirect("/admin/awards");
}

export async function deleteAwardAction(id: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await awardDb.deleteAward(id);
  revalidatePath("/admin/awards");
}

export async function addAwardAssociationAction(formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const entityType = formData.get("entityType") as string;
  const entityId = formData.get("entityId") as string;
  const awardId = formData.get("awardId") as string;

  switch (entityType) {
    case "monster":
      await awardDb.addAwardToMonster(entityId, awardId);
      break;
    case "item":
      await awardDb.addAwardToItem(entityId, awardId);
      break;
    case "companion":
      await awardDb.addAwardToCompanion(entityId, awardId);
      break;
    case "subclass":
      await awardDb.addAwardToSubclass(entityId, awardId);
      break;
    case "school":
      await awardDb.addAwardToSchool(entityId, awardId);
      break;
  }

  revalidatePath("/admin/awards");
}

export async function removeAwardAssociationAction(
  entityType: string,
  entityId: string,
  awardId: string
) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  switch (entityType) {
    case "monster":
      await awardDb.removeAwardFromMonster(entityId, awardId);
      break;
    case "item":
      await awardDb.removeAwardFromItem(entityId, awardId);
      break;
    case "companion":
      await awardDb.removeAwardFromCompanion(entityId, awardId);
      break;
    case "subclass":
      await awardDb.removeAwardFromSubclass(entityId, awardId);
      break;
    case "school":
      await awardDb.removeAwardFromSchool(entityId, awardId);
      break;
  }

  revalidatePath("/admin/awards");
}

export async function searchEntitiesAction(entityType: string, query: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  return awardDb.searchEntities(entityType, query);
}
