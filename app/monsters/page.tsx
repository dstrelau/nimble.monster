// app/monsters/page.tsx
import { MonstersListView } from "@/app/ui/MonstersListView";
import * as db from "@/lib/db";

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const selectedId = params.id;

  const monsters = await db.listPublicMonsterMinis();

  return (
    <div className="container mx-auto py-3">
      <MonstersListView monsters={monsters} initialSelectedId={selectedId} />
    </div>
  );
}
