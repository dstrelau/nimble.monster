"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONAPIFamily } from "@/lib/api/monsters";
import { isAdmin } from "@/lib/auth";
import * as awardDb from "@/lib/db/award";
import { getDatabase } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import * as sourceDb from "@/lib/db/source";
import {
  findOrCreateOfficialFamily,
  OFFICIAL_USER_ID,
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import {
  deletePreviewSession,
  readPreviewSession,
  writePreviewSession,
} from "@/lib/services/monsters/preview-session";
import { upsertOfficialMonster } from "@/lib/services/monsters/repository";
import { awardSlugify } from "@/lib/utils/slug";

export async function createAwardAction(formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  const description = (formData.get("description") as string) || "";
  const url = formData.get("url") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string;
  const slug = awardSlugify(abbreviation);

  await awardDb.createAward({
    name,
    abbreviation,
    description,
    slug,
    url,
    color,
    icon,
  });
  revalidatePath("/admin/awards");
  redirect("/admin/awards");
}

export async function updateAwardAction(id: string, formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  const description = (formData.get("description") as string) || "";
  const url = formData.get("url") as string;
  const color = formData.get("color") as string;
  const icon = formData.get("icon") as string;
  const slug = awardSlugify(abbreviation);

  await awardDb.updateAward(id, {
    name,
    abbreviation,
    description,
    slug,
    url,
    color,
    icon,
  });
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
    case "ancestry":
      await awardDb.addAwardToAncestry(entityId, awardId);
      break;
    case "background":
      await awardDb.addAwardToBackground(entityId, awardId);
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
    case "ancestry":
      await awardDb.removeAwardFromAncestry(entityId, awardId);
      break;
    case "background":
      await awardDb.removeAwardFromBackground(entityId, awardId);
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

export async function createSourceAction(formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  const license = formData.get("license") as string;
  const link = formData.get("link") as string;

  await sourceDb.createSource({ name, abbreviation, license, link });
  revalidatePath("/admin/sources");
  redirect("/admin/sources");
}

export async function uploadOfficialMonstersAction(formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  const text = await file.text();
  const json: unknown = JSON.parse(text);

  const { monsters, families, source } = validateOfficialMonstersJSON(json);

  const sessionKey = crypto.randomUUID();
  await writePreviewSession(sessionKey, { monsters, families, source });

  redirect(`/admin/monsters/preview?session=${sessionKey}`);
}

export async function commitOfficialMonstersAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const sessionData = await readPreviewSession(sessionKey);
  if (!sessionData) {
    throw new Error("Session expired or invalid");
  }

  const monsters = sessionData.monsters;
  const familiesMap = new Map<string, JSONAPIFamily>(sessionData.families);
  const source = sessionData.source;

  const db = await getDatabase();
  await db
    .insert(users)
    .values({
      id: OFFICIAL_USER_ID,
      username: "nimble-co",
      displayName: "Nimble Co.",
      imageUrl: "/images/nimble-n.png",
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username: "nimble-co",
        displayName: "Nimble Co.",
        imageUrl: "/images/nimble-n.png",
      },
    });

  let sourceId: string | undefined;
  if (source) {
    sourceId = await sourceDb.findOrCreateSource(source);
  }

  const familyIdMap = new Map<string, string>();

  for (const [familyRefId, familyData] of familiesMap.entries()) {
    const familyId = await findOrCreateOfficialFamily(
      familyData.attributes.name,
      familyData.attributes.description,
      familyData.attributes.abilities
    );
    familyIdMap.set(familyRefId, familyId);
  }

  for (const monsterData of monsters) {
    const input = parseJSONAPIMonster(monsterData);
    if (monsterData.relationships?.family?.data?.id) {
      const familyRefId = monsterData.relationships.family.data.id;
      const familyId = familyIdMap.get(familyRefId);
      if (familyId) {
        input.families = [{ id: familyId }];
      }
    }
    if (sourceId) {
      input.sourceId = sourceId;
    }
    await upsertOfficialMonster(input);
  }

  await deletePreviewSession(sessionKey);
  revalidatePath("/monsters");
  redirect("/admin/monsters");
}

export async function cancelOfficialMonstersUploadAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await deletePreviewSession(sessionKey);
  redirect("/admin/monsters");
}
