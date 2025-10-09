import { notFound } from "next/navigation";
import { FilterableCardGrid } from "@/app/ui/monster/FilterableCardGrid";
import { auth } from "@/lib/auth";
import { monstersService } from "@/lib/services/monsters";

export type MonsterDisplay = "card" | "list" | "table";

export default async function MyMonstersPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const monsters = await monstersService.listMonstersForUser(
    session.user.discordId
  );
  return (
    <div className="container mx-auto py-3">
      <FilterableCardGrid monsters={monsters} />
    </div>
  );
}
