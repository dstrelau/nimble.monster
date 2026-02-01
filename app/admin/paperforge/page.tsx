import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaperforgeImageUrl } from "@/components/PaperforgeImage";
import { isAdmin } from "@/lib/auth";
import { PAPERFORGE_ENTRIES } from "@/lib/paperforge-catalog";

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

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {PAPERFORGE_ENTRIES.map((entry) => (
          <Link
            key={entry.id}
            href={entry.postUrl ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border bg-card p-3 space-y-2 text-center transition-colors hover:bg-accent hover:border-accent-foreground/20"
          >
            <div className="relative aspect-square rounded overflow-hidden">
              {/* biome-ignore lint/performance/noImgElement: Using pre-sized Tigris images */}
              <img
                src={getPaperforgeImageUrl(entry.folder, 200)}
                alt={entry.name}
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <p className="font-medium text-sm truncate" title={entry.name}>
                {entry.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {entry.id}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
