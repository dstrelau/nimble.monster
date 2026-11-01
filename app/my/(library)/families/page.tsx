import { notFound } from "next/navigation";
import { FamilyCard } from "@/components/family/FamilyCard";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { getUserFamiliesWithMonsters } from "@/lib/db";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MyFamiliesPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const families = await getUserFamiliesWithMonsters(session.user.discordId);

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.family}
        title="My Families"
        newHref="/families/new"
        newLabel="New Family"
      />
      {families.length === 0 ? (
        <EmptyState entityName="families" />
      ) : (
        <div className="grid gap-8 items-start md:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              monsters={family.monsters}
              showEditDeleteButtons
            />
          ))}
        </div>
      )}
    </div>
  );
}
