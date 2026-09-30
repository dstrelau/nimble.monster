import { notFound } from "next/navigation";
import { CardGrid } from "@/components/item/CardGrid";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { itemsService } from "@/lib/services/items";

export default async function MyItemsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const items = await itemsService.listItemsForUser(session.user.discordId);
  if (items.length === 0) {
    return <CreateEmptyState href="/items/new" entityName="Item" />;
  }
  return <CardGrid items={items} gridColumns={{ default: 1, md: 2, lg: 3 }} />;
}
