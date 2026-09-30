import { redirect } from "next/navigation";
import { SchoolsListView } from "@/components/school/SchoolsListView";
import { CreateEmptyState } from "@/components/shared/GridStates";
import { auth } from "@/lib/auth";
import { listAllSpellSchoolsForDiscordID } from "@/lib/db/school";

export default async function MySpellsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const spellSchools = await listAllSpellSchoolsForDiscordID(
    session.user.discordId
  );

  if (spellSchools.length === 0) {
    return (
      <CreateEmptyState href="/spell-schools/new" entityName="Spell School" />
    );
  }

  return <SchoolsListView spellSchools={spellSchools} />;
}
