import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { PAPERFORGE_ENTRIES } from "@/lib/paperforge-catalog";
import { PaperforgeCatalog } from "./PaperforgeCatalog";

export default async function PaperforgePage() {
  if (!(await isAdmin())) {
    notFound();
  }

  return (
    <div className="py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Paperforge Catalog</h1>
        <p className="text-muted-foreground">
          {PAPERFORGE_ENTRIES.length} entries available
        </p>
      </div>

      <PaperforgeCatalog entries={PAPERFORGE_ENTRIES} />
    </div>
  );
}
