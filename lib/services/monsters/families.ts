import { prisma } from "@/lib/db";

export async function syncMonsterFamilies(
  monsterId: string,
  familyIds: string[]
): Promise<void> {
  await prisma.monsterFamily.deleteMany({
    where: { monsterId },
  });

  if (familyIds.length > 0) {
    await prisma.monsterFamily.createMany({
      data: familyIds.map((familyId) => ({
        monsterId,
        familyId,
      })),
      skipDuplicates: true,
    });
  }
}
