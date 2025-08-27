import { notFound } from "next/navigation";
import { loadOfficialConditions } from "@/app/actions/conditions";
import { CardGrid } from "@/app/ui/item/CardGrid";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";

export default async function MyItemsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const items = await db.listAllItemsForDiscordID(session.user.id);
  const conditions = await loadOfficialConditions();
  return (
    <div className="container mx-auto py-3">
      <CardGrid items={items} gridColumns={{ default: 1, md: 2, lg: 3 }} conditions={conditions} />
    </div>
  );
}
