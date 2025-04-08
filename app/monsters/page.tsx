import { MonsterCardGrid } from "@/ui/MonsterCard";
import * as db from "@/lib/db";

export default async function MonstersPage() {
  const monsters = await db.listPublicMonsters();
  return (
    <div className="container mx-auto">
      <MonsterCardGrid monsters={monsters} showActions={false} />
    </div>
  );
}
