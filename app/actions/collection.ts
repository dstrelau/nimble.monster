"use server";

import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { forbidden, unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { getDatabase } from "@/lib/db/drizzle";
import {
  ancestries,
  backgrounds,
  companions,
  items,
  monsters,
  spellSchools,
  subclasses,
} from "@/lib/db/schema";
import type { CollectionOverview, CollectionVisibilityType } from "@/lib/types";

export async function deleteCollection(collectionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const deleted = await db.deleteCollection({
      id: collectionId,
      discordId: session.user.discordId,
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
      discordId: session.user.discordId,
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
      discordId: session.user.discordId,
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

export async function addMonsterToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const monsterId = formData.get("monsterId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!monsterId || !collectionId) {
    return { success: false, error: "Missing monsterId or collectionId" };
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
    .select({ id: monsters.id })
    .from(monsters)
    .where(
      and(
        eq(monsters.id, monsterId),
        or(
          eq(monsters.visibility, "public"),
          eq(monsters.userId, session.user.id)
        )
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addMonsterToCollection({ monsterId, collectionId });
  return { success: true };
}

export async function addItemToCollection(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const itemId = formData.get("itemId")?.toString();
  const collectionId = formData.get("collectionId")?.toString();
  if (!itemId || !collectionId) {
    return { success: false, error: "Missing itemId or collectionId" };
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
    .select({ id: items.id })
    .from(items)
    .where(
      and(
        eq(items.id, itemId),
        or(eq(items.visibility, "public"), eq(items.userId, session.user.id))
      )
    )
    .limit(1);
  if (accessible.length === 0) {
    return forbidden();
  }

  await db.addItemToCollection({ itemId, collectionId });
  return { success: true };
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
