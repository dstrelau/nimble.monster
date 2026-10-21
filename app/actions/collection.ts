"use server";

import { and, eq, or } from "drizzle-orm";
import { forbidden, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { getDatabase } from "@/lib/db/drizzle";
import {
  ancestries,
  backgrounds,
  classes,
  companions,
  spellSchools,
  subclasses,
} from "@/lib/db/schema";

export async function listOwnCollections() {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }
  const collections = await db.listCollectionsWithMonstersForUser(
    session.user.discordId
  );
  return { success: true, collections };
}

export async function addSpellSchoolToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const spellSchoolId = formData.get("spellSchoolId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!spellSchoolId || !collectionId) {
    return { success: false, error: "Missing spellSchoolId or collectionId" };
  }

  const collection = await db.getCollection(
    collectionId,
    session.user.discordId
  );
  if (!collection) {
    return {
      success: false,
      error: "Collection not found or you don't have permission to update it",
    };
  }

  if (collection.creator.discordId !== session.user.discordId) {
    return forbidden();
  }

  const entityDb = getDatabase();
  const accessible = await entityDb
    .select({ id: spellSchools.id })
    .from(spellSchools)
    .where(
      and(
        eq(spellSchools.id, spellSchoolId),
        or(
          eq(spellSchools.visibility, "public"),
          eq(spellSchools.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addSpellSchoolToCollection({ spellSchoolId, collectionId });
  return { success: true };
}

export async function addCompanionToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const companionId = formData.get("companionId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!companionId || !collectionId) {
    return { success: false, error: "Missing companionId or collectionId" };
  }

  const collection = await db.getCollection(
    collectionId,
    session.user.discordId
  );
  if (!collection) {
    return {
      success: false,
      error: "Collection not found or you don't have permission to update it",
    };
  }

  if (collection.creator.discordId !== session.user.discordId) {
    return forbidden();
  }

  const entityDb = getDatabase();
  const accessible = await entityDb
    .select({ id: companions.id })
    .from(companions)
    .where(
      and(
        eq(companions.id, companionId),
        or(
          eq(companions.visibility, "public"),
          eq(companions.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addCompanionToCollection({ companionId, collectionId });
  return { success: true };
}

export async function addAncestryToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const ancestryId = formData.get("ancestryId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!ancestryId || !collectionId) {
    return { success: false, error: "Missing ancestryId or collectionId" };
  }

  const collection = await db.getCollection(
    collectionId,
    session.user.discordId
  );
  if (!collection) {
    return {
      success: false,
      error: "Collection not found or you don't have permission to update it",
    };
  }

  if (collection.creator.discordId !== session.user.discordId) {
    return forbidden();
  }

  const entityDb = getDatabase();
  const accessible = await entityDb
    .select({ id: ancestries.id })
    .from(ancestries)
    .where(
      and(
        eq(ancestries.id, ancestryId),
        or(
          eq(ancestries.visibility, "public"),
          eq(ancestries.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addAncestryToCollection({ ancestryId, collectionId });
  return { success: true };
}

export async function addBackgroundToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const backgroundId = formData.get("backgroundId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!backgroundId || !collectionId) {
    return { success: false, error: "Missing backgroundId or collectionId" };
  }

  const collection = await db.getCollection(
    collectionId,
    session.user.discordId
  );
  if (!collection) {
    return {
      success: false,
      error: "Collection not found or you don't have permission to update it",
    };
  }

  if (collection.creator.discordId !== session.user.discordId) {
    return forbidden();
  }

  const entityDb = getDatabase();
  const accessible = await entityDb
    .select({ id: backgrounds.id })
    .from(backgrounds)
    .where(
      and(
        eq(backgrounds.id, backgroundId),
        or(
          eq(backgrounds.visibility, "public"),
          eq(backgrounds.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addBackgroundToCollection({ backgroundId, collectionId });
  return { success: true };
}

export async function addSubclassToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const subclassId = formData.get("subclassId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!subclassId || !collectionId) {
    return { success: false, error: "Missing subclassId or collectionId" };
  }

  const collection = await db.getCollection(
    collectionId,
    session.user.discordId
  );
  if (!collection) {
    return {
      success: false,
      error: "Collection not found or you don't have permission to update it",
    };
  }

  if (collection.creator.discordId !== session.user.discordId) {
    return forbidden();
  }

  const entityDb = getDatabase();
  const accessible = await entityDb
    .select({ id: subclasses.id })
    .from(subclasses)
    .where(
      and(
        eq(subclasses.id, subclassId),
        or(
          eq(subclasses.visibility, "public"),
          eq(subclasses.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addSubclassToCollection({ subclassId, collectionId });
  return { success: true };
}

export async function addClassToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const classId = formData.get("classId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!classId || !collectionId) {
    return { success: false, error: "Missing classId or collectionId" };
  }

  const collection = await db.getCollection(
    collectionId,
    session.user.discordId
  );
  if (!collection) {
    return {
      success: false,
      error: "Collection not found or you don't have permission to update it",
    };
  }

  if (collection.creator.discordId !== session.user.discordId) {
    return forbidden();
  }

  const entityDb = getDatabase();
  const accessible = await entityDb
    .select({ id: classes.id })
    .from(classes)
    .where(
      and(
        eq(classes.id, classId),
        or(
          eq(classes.visibility, "public"),
          eq(classes.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addClassToCollection({ classId, collectionId });
  return { success: true };
}
