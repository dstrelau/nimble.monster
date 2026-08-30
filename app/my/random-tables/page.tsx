import { notFound } from "next/navigation";
import { RandomTableCard } from "@/components/random-table/RandomTableCard";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { isFeatureFlagEnabled } from "@/lib/services/featureFlags";

export default async function MyRandomTablesPage() {
  const session = await auth();
  if (
    !session?.user?.id ||
    !(await isFeatureFlagEnabled(session.user.id, "random-tables"))
  ) {
    notFound();
  }

  const randomTables = await db.listRandomTablesForUser(session.user.discordId);
  return (
    <div className="space-y-6">
      {randomTables.length === 0 ? (
        <div className="d-alert d-alert-info">
          <p>
            No random tables yet. Create your first random table to get started!
          </p>
        </div>
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
