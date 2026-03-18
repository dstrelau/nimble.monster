import { SchoolsListView } from "@/app/ui/school/SchoolsListView";
import { listPublicSpellSchools } from "@/lib/db/school";
import { isOfficialOnlyDomain } from "@/lib/domain";

export default async function SchoolsPage() {
  const officialOnly = await isOfficialOnlyDomain();
  const spellSchools = await listPublicSpellSchools(officialOnly);

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
