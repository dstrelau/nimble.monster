import { notFound } from "next/navigation";
import { AdventureList } from "@/components/adventure/AdventureList";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { listAdventuresForUser } from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MyAdventuresPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const adventures = await listAdventuresForUser(session.user.id);
  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.adventure}
        title="My Adventures"
        newHref="/adventures/new"
        newLabel="New Adventure"
      />
      {adventures.length === 0 ? (
        <EmptyState entityName="adventures" />
      ) : (
        <AdventureList adventures={adventures} />
      )}
    </div>
  );
}
