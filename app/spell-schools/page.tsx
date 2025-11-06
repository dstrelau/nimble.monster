import { SchoolsListView } from "@/app/ui/school/SchoolsListView";
import { listPublicSpellSchools } from "@/lib/db/school";

export default async function SchoolsPage() {
  const spellSchools = await listPublicSpellSchools();

  if (spellSchools?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No public spell schools available yet.
        </p>
      </div>
    );
  }

  return <SchoolsListView spellSchools={spellSchools} />;
}
