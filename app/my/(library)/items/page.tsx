import { notFound } from "next/navigation";
import { CardGrid } from "@/components/item/CardGrid";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { itemsService } from "@/lib/services/items";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MyItemsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const items = await itemsService.listItemsForUser(session.user.discordId);
  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.item}
        title="My Items"
        newHref="/items/new"
        newLabel="New Item"
      />
      {items.length === 0 ? (
        <EmptyState entityName="items" />
      ) : (
        <CardGrid items={items} gridColumns={{ default: 1, md: 2, lg: 3 }} />
      )}
    </div>
  );
}
