import { notFound } from "next/navigation";
import { CardGrid } from "@/components/companion/CardGrid";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import * as db from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MyCompanionsPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const companions = await db.listAllCompanionsForDiscordID(
    session.user.discordId
  );

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.companion}
        title="My Companions"
        newHref="/companions/new"
        newLabel="New Companion"
      />
      {companions.length === 0 ? (
        <EmptyState entityName="companions" />
      ) : (
        <CardGrid
          companions={companions}
          gridColumns={{ default: 1, md: 1, lg: 2 }}
        />
      )}
    </div>
  );
}
