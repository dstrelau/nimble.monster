"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  CollectionVisibilityType,
  ValidCollectionVisibilities,
} from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(ValidCollectionVisibilities),
  description: z.string().optional(),
  monsterIds: z.string().array(),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;

export async function updateCollection(
  collectionId: string,
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Parse form data
  const parsed = collectionSchema.parse({
    name: formData.get("name"),
    visibility: formData.get("visibility"),
    description: formData.get("description") || "",
    monsterIds: JSON.parse(formData.get("monsterIds")?.toString() || "[]"),
  });

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: { creator: true },
  });

  if (!collection) throw new Error("Not Found");
  if (collection.creator.discordId !== session.user.id)
    throw new Error("Unauthorized");

  await prisma.$transaction(async (tx) => {
    await tx.collection.update({
      where: { id: collectionId },
      data: {
        name: parsed.name,
        visibility: parsed.visibility as CollectionVisibilityType,
        description: parsed.description,
      },
    });

    const existingMonsters = (
      await tx.monsterInCollection.findMany({
        where: { collectionId },
      })
    ).map((monster) => monster.monsterId);

    const toDelete = existingMonsters.filter(
      (id) => !parsed.monsterIds.includes(id),
    );
    const toAdd = parsed.monsterIds.filter(
      (id) => !existingMonsters.includes(id),
    );

    await Promise.all([
      tx.monsterInCollection.deleteMany({
        where: {
          collectionId,
          monsterId: { in: toDelete },
        },
      }),
      tx.monsterInCollection.createMany({
        data: toAdd.map((monsterId) => ({
          monsterId,
          collectionId,
        })),
      }),
    ]);
  });

  revalidatePath(`/my/collections/${collectionId}/edit`);

  return { success: true, monsterIds: parsed.monsterIds };
}
