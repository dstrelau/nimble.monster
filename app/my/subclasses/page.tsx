import { notFound } from "next/navigation";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { SubclassesListView } from "@/components/subclass/SubclassesListView";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MySubclassesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const subclasses = await db.listAllSubclassesForDiscordID(
    session.user.discordId
  );

  return (
    <div className="py-3">
      {subclasses.length === 0 ? (
        <CreateEmptyState href="/subclasses/new" entityName="Subclass" />
      ) : (
        <SubclassesListView subclasses={subclasses} />
      )}
    </div>
  );
}
