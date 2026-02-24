"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JSONAPIFamily } from "@/lib/api/monsters";
import { isAdmin } from "@/lib/auth";
import * as awardDb from "@/lib/db/award";
import * as sourceDb from "@/lib/db/source";
import {
  type AncestrySessionData,
  validateOfficialAncestriesJSON,
} from "@/lib/services/ancestries/official";
import { upsertOfficialAncestry } from "@/lib/services/ancestries/repository";
import {
  type BackgroundSessionData,
  validateOfficialBackgroundsJSON,
} from "@/lib/services/backgrounds/official";
import { upsertOfficialBackground } from "@/lib/services/backgrounds/repository";
import {
  type ClassSessionData,
  validateOfficialClassesJSON,
} from "@/lib/services/classes/official";
import { upsertOfficialClass } from "@/lib/services/classes/repository";
import { ensureOfficialUser } from "@/lib/services/ensure-official-user";
import {
  findOrCreateOfficialFamily,
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import {
  deletePreviewSession,
  readPreviewSession,
  writePreviewSession,
} from "@/lib/services/monsters/preview-session";
import { upsertOfficialMonster } from "@/lib/services/monsters/repository";
import {
  deletePreviewSession as deleteGenericPreviewSession,
  readPreviewSession as readGenericPreviewSession,
  writePreviewSession as writeGenericPreviewSession,
} from "@/lib/services/preview-session";
import {
  type SpellSchoolSessionData,
  validateOfficialSpellSchoolsJSON,
} from "@/lib/services/spell-schools/official";
import { upsertOfficialSpellSchool } from "@/lib/services/spell-schools/repository";
import {
  type SubclassSessionData,
  validateOfficialSubclassesJSON,
} from "@/lib/services/subclasses/official";
import { upsertOfficialSubclass } from "@/lib/services/subclasses/repository";
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

export async function updateSourceAction(id: string, formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const abbreviation = formData.get("abbreviation") as string;
  const license = formData.get("license") as string;
  const link = formData.get("link") as string;

  await sourceDb.updateSource(id, { name, abbreviation, license, link });
  revalidatePath("/admin/sources");
}

export async function deleteSourceAction(id: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await sourceDb.deleteSource(id);
  revalidatePath("/admin/sources");
}

async function parseFormDataFile(formData: FormData): Promise<unknown> {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }
  const text = await file.text();
  return JSON.parse(text);
}

export async function uploadOfficialContentAction(formData: FormData) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const json = await parseFormDataFile(formData);

  if (
    typeof json !== "object" ||
    json === null ||
    !("data" in json) ||
    !Array.isArray((json as { data: unknown }).data) ||
    (json as { data: unknown[] }).data.length === 0
  ) {
    throw new Error(
      "Invalid JSON: expected an object with a non-empty 'data' array"
    );
  }

  const firstItem = (json as { data: Array<{ type?: string }> }).data[0];
  const contentType = firstItem?.type;

  switch (contentType) {
    case "monsters":
      return uploadOfficialMonstersFromJSON(json);
    case "ancestries":
      return uploadOfficialAncestriesFromJSON(json);
    case "backgrounds":
      return uploadOfficialBackgroundsFromJSON(json);
    case "classes":
      return uploadOfficialClassesFromJSON(json);
    case "subclasses":
      return uploadOfficialSubclassesFromJSON(json);
    case "spell-schools":
      return uploadOfficialSpellSchoolsFromJSON(json);
    default:
      throw new Error(
        `Unknown content type: "${contentType}". Expected "monsters", "ancestries", "backgrounds", "classes", "subclasses", or "spell-schools".`
      );
  }
}

async function uploadOfficialMonstersFromJSON(json: unknown) {
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

  await ensureOfficialUser();

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
  redirect("/admin");
}

export async function cancelOfficialMonstersUploadAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await deletePreviewSession(sessionKey);
  redirect("/admin");
}

// --- Ancestries ---

async function uploadOfficialAncestriesFromJSON(json: unknown) {
  const { ancestries, source } = validateOfficialAncestriesJSON(json);

  const sessionKey = crypto.randomUUID();
  await writeGenericPreviewSession<AncestrySessionData>(
    "ancestries",
    sessionKey,
    { ancestries, source }
  );

  redirect(`/admin/ancestries/preview?session=${sessionKey}`);
}

export async function commitOfficialAncestriesAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const sessionData = await readGenericPreviewSession<AncestrySessionData>(
    "ancestries",
    sessionKey
  );
  if (!sessionData) {
    throw new Error("Session expired or invalid");
  }

  await ensureOfficialUser();

  let sourceId: string | undefined;
  if (sessionData.source) {
    sourceId = await sourceDb.findOrCreateSource(sessionData.source);
  }

  for (const ancestry of sessionData.ancestries) {
    await upsertOfficialAncestry({
      name: ancestry.attributes.name,
      description: ancestry.attributes.description,
      size: ancestry.attributes.size,
      rarity: ancestry.attributes.rarity,
      abilities: ancestry.attributes.abilities,
      sourceId,
    });
  }

  await deleteGenericPreviewSession("ancestries", sessionKey);
  revalidatePath("/ancestries");
  redirect("/admin");
}

export async function cancelOfficialAncestriesUploadAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await deleteGenericPreviewSession("ancestries", sessionKey);
  redirect("/admin");
}

// --- Backgrounds ---

async function uploadOfficialBackgroundsFromJSON(json: unknown) {
  const { backgrounds, source } = validateOfficialBackgroundsJSON(json);

  const sessionKey = crypto.randomUUID();
  await writeGenericPreviewSession<BackgroundSessionData>(
    "backgrounds",
    sessionKey,
    { backgrounds, source }
  );

  redirect(`/admin/backgrounds/preview?session=${sessionKey}`);
}

export async function commitOfficialBackgroundsAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const sessionData = await readGenericPreviewSession<BackgroundSessionData>(
    "backgrounds",
    sessionKey
  );
  if (!sessionData) {
    throw new Error("Session expired or invalid");
  }

  await ensureOfficialUser();

  let sourceId: string | undefined;
  if (sessionData.source) {
    sourceId = await sourceDb.findOrCreateSource(sessionData.source);
  }

  for (const bg of sessionData.backgrounds) {
    await upsertOfficialBackground({
      name: bg.attributes.name,
      description: bg.attributes.description,
      requirement: bg.attributes.requirement,
      sourceId,
    });
  }

  await deleteGenericPreviewSession("backgrounds", sessionKey);
  revalidatePath("/backgrounds");
  redirect("/admin");
}

export async function cancelOfficialBackgroundsUploadAction(
  sessionKey: string
) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await deleteGenericPreviewSession("backgrounds", sessionKey);
  redirect("/admin");
}

// --- Classes ---

async function uploadOfficialClassesFromJSON(json: unknown) {
  const { classes: classesData, source } = validateOfficialClassesJSON(json);

  const sessionKey = crypto.randomUUID();
  await writeGenericPreviewSession<ClassSessionData>("classes", sessionKey, {
    classes: classesData,
    source,
  });

  redirect(`/admin/classes/preview?session=${sessionKey}`);
}

export async function commitOfficialClassesAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const sessionData = await readGenericPreviewSession<ClassSessionData>(
    "classes",
    sessionKey
  );
  if (!sessionData) {
    throw new Error("Session expired or invalid");
  }

  await ensureOfficialUser();

  let sourceId: string | undefined;
  if (sessionData.source) {
    sourceId = await sourceDb.findOrCreateSource(sessionData.source);
  }

  for (const cls of sessionData.classes) {
    await upsertOfficialClass({
      name: cls.attributes.name,
      description: cls.attributes.description,
      keyStats: cls.attributes.keyStats,
      hitDie: cls.attributes.hitDie,
      startingHp: cls.attributes.startingHp,
      saves: cls.attributes.saves,
      armor: cls.attributes.armor,
      weapons: cls.attributes.weapons,
      startingGear: cls.attributes.startingGear,
      levels: cls.attributes.levels,
      abilityLists: cls.attributes.abilityLists,
      sourceId,
    });
  }

  await deleteGenericPreviewSession("classes", sessionKey);
  revalidatePath("/classes");
  redirect("/admin");
}

export async function cancelOfficialClassesUploadAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await deleteGenericPreviewSession("classes", sessionKey);
  redirect("/admin");
}

// --- Subclasses ---

async function uploadOfficialSubclassesFromJSON(json: unknown) {
  const { subclasses, source } = validateOfficialSubclassesJSON(json);

  const sessionKey = crypto.randomUUID();
  await writeGenericPreviewSession<SubclassSessionData>(
    "subclasses",
    sessionKey,
    { subclasses, source }
  );

  redirect(`/admin/subclasses/preview?session=${sessionKey}`);
}

export async function commitOfficialSubclassesAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const sessionData = await readGenericPreviewSession<SubclassSessionData>(
    "subclasses",
    sessionKey
  );
  if (!sessionData) {
    throw new Error("Session expired or invalid");
  }

  await ensureOfficialUser();

  let sourceId: string | undefined;
  if (sessionData.source) {
    sourceId = await sourceDb.findOrCreateSource(sessionData.source);
  }

  for (const sc of sessionData.subclasses) {
    await upsertOfficialSubclass({
      name: sc.attributes.name,
      className: sc.attributes.className,
      tagline: sc.attributes.tagline,
      description: sc.attributes.description,
      levels: sc.attributes.levels,
      sourceId,
    });
  }

  await deleteGenericPreviewSession("subclasses", sessionKey);
  revalidatePath("/subclasses");
  redirect("/admin");
}

export async function cancelOfficialSubclassesUploadAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await deleteGenericPreviewSession("subclasses", sessionKey);
  redirect("/admin");
}

// --- Spell Schools ---

async function uploadOfficialSpellSchoolsFromJSON(json: unknown) {
  const { spellSchools, source } = validateOfficialSpellSchoolsJSON(json);

  const sessionKey = crypto.randomUUID();
  await writeGenericPreviewSession<SpellSchoolSessionData>(
    "spell-schools",
    sessionKey,
    { spellSchools, source }
  );

  redirect(`/admin/spell-schools/preview?session=${sessionKey}`);
}

export async function commitOfficialSpellSchoolsAction(sessionKey: string) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const sessionData = await readGenericPreviewSession<SpellSchoolSessionData>(
    "spell-schools",
    sessionKey
  );
  if (!sessionData) {
    throw new Error("Session expired or invalid");
  }

  await ensureOfficialUser();

  let sourceId: string | undefined;
  if (sessionData.source) {
    sourceId = await sourceDb.findOrCreateSource(sessionData.source);
  }

  for (const school of sessionData.spellSchools) {
    await upsertOfficialSpellSchool({
      id: school.id,
      name: school.attributes.name,
      description: school.attributes.description,
      spells: school.attributes.spells.map((s) => ({
        ...s,
        target: s.target
          ? s.target.type === "self"
            ? { type: "self" as const }
            : s.target.type === "aoe"
              ? {
                  type: "aoe" as const,
                  kind: s.target.kind || ("range" as const),
                  distance: s.target.distance,
                }
              : {
                  type: s.target.type,
                  kind:
                    s.target.kind === "line" || s.target.kind === "cone"
                      ? ("range" as const)
                      : s.target.kind || ("range" as const),
                  distance: s.target.distance,
                }
          : undefined,
      })),
      sourceId,
    });
  }

  await deleteGenericPreviewSession("spell-schools", sessionKey);
  revalidatePath("/spell-schools");
  redirect("/admin");
}

export async function cancelOfficialSpellSchoolsUploadAction(
  sessionKey: string
) {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  await deleteGenericPreviewSession("spell-schools", sessionKey);
  redirect("/admin");
}
