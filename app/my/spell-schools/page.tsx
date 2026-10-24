import { redirect } from "next/navigation";
import { MyLibraryPageHeader } from "@/components/layout/MyLibraryPageHeader";
import { SchoolsListView } from "@/components/school/SchoolsListView";
import { EmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { listAllSpellSchoolsForDiscordID } from "@/lib/db/school";
import { ENTITY_TYPE_ICONS } from "@/lib/types/entity-links";

export default async function MySpellsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const spellSchools = await listAllSpellSchoolsForDiscordID(
    session.user.discordId
  );

  return (
    <div className="space-y-6">
      <MyLibraryPageHeader
        icon={ENTITY_TYPE_ICONS.school}
        title="My Spells"
        newHref="/spell-schools/new"
        newLabel="New Spell School"
      />
      {spellSchools.length === 0 ? (
        <EmptyState entityName="spell schools" />
      ) : (
        <SchoolsListView spellSchools={spellSchools} />
      )}
    </div>
  );
}
