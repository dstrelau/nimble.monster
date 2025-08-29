import { notFound } from "next/navigation";
import { CardGrid } from "@/app/ui/item/CardGrid";
import { auth } from "@/lib/auth";
import {
  listAllItemsForDiscordID,
  listConditionsForDiscordId,
  listOfficialConditions,
} from "@/lib/db";

export default async function MyItemsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [items, officialConditions, userConditions] = await Promise.all([
    listAllItemsForDiscordID(session.user.id),
    listOfficialConditions(),
    listConditionsForDiscordId(session.user.id),
  ]);
  const conditions = [...officialConditions, ...userConditions];
  return (
    <div className="container mx-auto py-3">
      <CardGrid
        items={items}
        gridColumns={{ default: 1, md: 2, lg: 3 }}
        conditions={conditions}
      />
    </div>
  );
}
