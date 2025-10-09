import { extractConditions } from "@/lib/conditions";
import { prisma } from "@/lib/db";

export function extractAllConditions(data: {
  actions: Array<{ description?: string }>;
  abilities: Array<{ description?: string; Description?: string }>;
  bloodied?: string;
  lastStand?: string;
  moreInfo?: string;
}): string[] {
  const allText = [
    ...data.actions.map((action) => action.description || ""),
    ...data.abilities.map(
      (ability) => ability.description || ability.Description || ""
    ),
    data.bloodied || "",
    data.lastStand || "",
    data.moreInfo || "",
  ].join(" ");

  return extractConditions(allText);
}

export async function syncMonsterConditions(
  monsterId: string,
  conditionNames: string[]
): Promise<void> {
  if (conditionNames.length === 0) {
    await prisma.monsterCondition.deleteMany({
      where: { monsterId },
    });
    return;
  }

  const existingConditions = await prisma.condition.findMany({
    where: {
      name: {
        in: conditionNames,
        mode: "insensitive",
      },
    },
    select: { id: true, name: true },
  });

  const foundConditionIds = existingConditions.map((c) => c.id);

  await prisma.monsterCondition.deleteMany({
    where: { monsterId },
  });

  if (foundConditionIds.length > 0) {
    await prisma.monsterCondition.createMany({
      data: foundConditionIds.map((conditionId) => ({
        monsterId,
        conditionId,
        inline: false,
      })),
      skipDuplicates: true,
    });
  }
}
