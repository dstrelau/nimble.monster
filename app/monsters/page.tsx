// app/monsters/page.tsx
import { MonstersListView } from "@/ui/MonstersListView";
import * as db from "@/lib/db";

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const monsters = await db.listPublicMonsters();
  const selectedMonsterId = searchParams.id;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Monsters</h1>
      <MonstersListView
        monsters={monsters}
        initialSelectedId={selectedMonsterId}
      />
    </div>
  );
}
