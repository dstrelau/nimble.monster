import { notFound } from "next/navigation";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { EmptyState } from "@/components/shared/GridStates";
import { SubclassesListView } from "@/components/subclass/SubclassesListView";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MySubclassesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const subclasses = await db.listAllSubclassesForDiscordID(
    session.user.discordId
  );

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.subclass}
        title="My Subclasses"
        newHref="/subclasses/new"
        newLabel="New Subclass"
      />
      {subclasses.length === 0 ? (
        <EmptyState entityName="subclasses" />
      ) : (
        <SubclassesListView subclasses={subclasses} />
      )}
    </div>
  );
}
