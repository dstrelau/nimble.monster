import { notFound } from "next/navigation";
import { RandomTableCard } from "@/components/random-table/RandomTableCard";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MyRandomTablesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const randomTables = await db.listRandomTablesForUser(session.user.discordId);
  return (
    <div className="space-y-6">
      {randomTables.length === 0 ? (
        <CreateEmptyState href="/tables/new" entityName="Reference Table" />
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
