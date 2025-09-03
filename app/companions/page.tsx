import { CompanionsListView } from "@/app/ui/CompanionsListView";
import * as db from "@/lib/db";

export default async function CompanionsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const selectedId = params.id;

  const companions = await db.listPublicCompanions();

  return (
    <div className="container mx-auto py-3">
      <CompanionsListView
        companions={companions}
        initialSelectedId={selectedId}
      />
    </div>
  );
}
