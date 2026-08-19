import Link from "next/link";
import { EntityReactions } from "@/components/EntityReactions";
import { Badge } from "@/components/ui/badge";
import type { AdventureOverview } from "@/lib/db/adventures";
import { getAdventureUrl } from "@/lib/utils/url";

interface AdventureListProps {
  adventures: AdventureOverview[];
  emptyMessage?: string;
}

export function AdventureList({
  adventures,
  emptyMessage = "No adventures yet. Create your first adventure to get started!",
}: AdventureListProps) {
  if (adventures.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">{emptyMessage}</p>
    );
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
      {adventures.map((adventure) => (
        <div
          key={adventure.id}
          className="rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <Link
            href={getAdventureUrl(adventure)}
            className="group block p-5 transition-colors hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-slab text-xl font-bold group-hover:underline">
                {adventure.name}
              </h2>
              <Badge variant="outline" className="shrink-0">
                {adventure.visibility === "public" ? "Public" : "Private"}
              </Badge>
            </div>
            {adventure.tagline && (
              <p className="mt-2 text-sm italic text-muted-foreground">
                {adventure.tagline}
              </p>
            )}
            {adventure.summary && (
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {adventure.summary}
              </p>
            )}
          </Link>
          <div className="flex justify-end px-5 pb-4">
            <EntityReactions entityType="adventure" entityId={adventure.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
