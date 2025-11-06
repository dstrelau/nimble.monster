import { SubclassesListView } from "@/app/ui/subclass/SubclassesListView";
import { listPublicSubclasses } from "@/lib/db/subclass";

export default async function SubclassesPage() {
  const subclasses = await listPublicSubclasses();

  if (subclasses?.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No public subclasses available yet.
        </p>
      </div>
    );
  }

  return <SubclassesListView subclasses={subclasses} />;
}
