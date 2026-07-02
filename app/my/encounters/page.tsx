import { notFound } from "next/navigation";
import { EncounterCard } from "@/app/ui/EncounterCard";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MyEncountersPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const encounters = await db.listEncountersWithMonstersForUser(
    session.user.discordId
  );
  return (
    <div className="space-y-6">
      {encounters.length === 0 ? (
        <div className="d-alert d-alert-info">
          <p>No encounters yet. Create your first encounter to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {encounters.map((e) => (
            <EncounterCard key={e.id} encounter={e} />
          ))}
        </div>
      )}
    </div>
  );
}
