import { notFound } from "next/navigation";
import { CardGrid } from "@/app/ui/item/CardGrid";
import { auth } from "@/lib/auth";
import { itemsService } from "@/lib/services/items";

export default async function MyItemsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const items = await itemsService.listItemsForUser(session.user.discordId);
  return (
    <div className="container mx-auto py-3">
      <CardGrid items={items} gridColumns={{ default: 1, md: 2, lg: 3 }} />
    </div>
  );
}
