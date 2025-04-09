// app/monsters/page.tsx
import { MonstersListView } from "@/ui/MonstersListView";
import * as db from "@/lib/db";

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const monsters = await db.listPublicMonsters();
  const selectedMonsterId = (await searchParams).id;

  return (
    <div className="container mx-auto">
      <MonstersListView
        monsters={monsters}
        initialSelectedId={selectedMonsterId}
      />
    </div>
  );
}
