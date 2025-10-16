import { MonstersListView } from "@/app/ui/MonstersListView";
import { monstersService } from "@/lib/services/monsters";

export default async function MonstersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const selectedId = params.id;

  const monsters = await monstersService.listPublicMonsters();

  return (
    <div className="container mx-auto py-3">
      <MonstersListView monsters={monsters} initialSelectedId={selectedId} />
    </div>
  );
}
