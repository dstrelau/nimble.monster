import { MonsterCardGrid } from "@/ui/MonsterCard";
import { Ability, Action, Monster } from "@/lib/types";
import { PrismaClient } from "@/lib/prisma";

export default async function MonstersPage() {
  const prisma = new PrismaClient();
  const monsters = (
    await prisma.monster.findMany({
      where: { visibility: "public" },
      orderBy: { name: "asc" },
    })
  ).map(
    (m): Monster => ({
      ...m,
      saves: m.saves.join(" "),
      armor: m.armor === "EMPTY_ENUM_VALUE" ? "" : m.armor,
      abilities: m.abilities as unknown as Ability[],
      actions: m.actions as unknown as Action[],
      actionPreface: m.actionPreface || "",
      moreInfo: m.moreInfo || "",
    }),
  );

  return (
    <div className="container mx-auto py-6">
      <MonsterCardGrid monsters={monsters} showActions={false} />
    </div>
  );
}
