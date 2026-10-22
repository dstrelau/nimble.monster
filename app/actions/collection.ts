"use server";

import { and, eq, or } from "drizzle-orm";
import { forbidden, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { getDatabase } from "@/lib/db/drizzle";
import { classes } from "@/lib/db/schema";

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
