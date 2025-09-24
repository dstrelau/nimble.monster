import { notFound } from "next/navigation";
import { Card } from "@/app/ui/subclass/Card";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MySubclassesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const subclasses = await db.listAllSubclassesForDiscordID(
    session.user.discordId
  );

  return (
    <div className="container mx-auto py-3">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subclasses.map((subclass) => (
          <Card
            key={subclass.id}
            subclass={subclass}
            creator={subclass.creator}
            link={true}
          />
        ))}
      </div>
      {subclasses.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No subclasses found.{" "}
          <a href="/subclasses/new" className="text-primary hover:underline">
            Create your first subclass
          </a>
          .
        </div>
      )}
    </div>
  );
}
