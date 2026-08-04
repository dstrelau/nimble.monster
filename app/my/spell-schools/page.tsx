import Link from "next/link";
import { redirect } from "next/navigation";
import { SchoolsListView } from "@/components/school/SchoolsListView";
import { Button } from "@/components/ui/button";
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
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">
          You haven&apos;t created any spell schools yet.
        </p>
        <Button asChild>
          <Link href="/spell-schools/new">Create Your First School</Link>
        </Button>
      </div>
    );
  }

  return <SchoolsListView spellSchools={spellSchools} />;
}
