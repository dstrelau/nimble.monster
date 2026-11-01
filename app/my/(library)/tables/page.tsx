import { notFound } from "next/navigation";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { RandomTableCard } from "@/components/random-table/RandomTableCard";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MyRandomTablesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const randomTables = await db.listRandomTablesForUser(session.user.discordId);
  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.table}
        title="My Reference Tables"
        newHref="/tables/new"
        newLabel="New Reference Table"
      />
      {randomTables.length === 0 ? (
        <EmptyState entityName="reference tables" />
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
          {randomTables.map((randomTable) => (
            <RandomTableCard key={randomTable.id} randomTable={randomTable} />
          ))}
        </div>
      )}
    </div>
  );
}
