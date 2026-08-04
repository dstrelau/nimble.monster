import { notFound } from "next/navigation";
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
        <div className="text-center text-muted-foreground py-8">
          No subclasses found.{" "}
          <a href="/subclasses/new" className="text-primary hover:underline">
            Create your first subclass
          </a>
          .
        </div>
      ) : (
        <SubclassesListView subclasses={subclasses} />
      )}
    </div>
  );
}
