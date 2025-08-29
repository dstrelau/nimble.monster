import { notFound } from "next/navigation";
import { CardGrid } from "@/app/ui/companion/CardGrid";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { listConditionsForDiscordId, listOfficialConditions } from "@/lib/db";

export default async function MyCompanionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const companions = await db.listAllCompanionsForDiscordID(session.user.id);

  const [officialConditions, userConditions] = await Promise.all([
    listOfficialConditions(),
    listConditionsForDiscordId(session.user.id),
  ]);
  const conditions = [...officialConditions, ...userConditions];

  return (
    <div className="container mx-auto py-3">
      <CardGrid
        companions={companions}
        conditions={conditions}
        gridColumns={{ default: 1, md: 1, lg: 2 }}
      />
    </div>
  );
}
