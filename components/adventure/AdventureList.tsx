import { EntityReactions } from "@/components/EntityReactions";
import { Link } from "@/components/layout/Link";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <Card key={adventure.id}>
          <CardHeader>
            <CardTitle className="font-slab text-xl font-bold">
              <h2>
                <Link href={getAdventureUrl(adventure)}>{adventure.name}</Link>
              </h2>
            </CardTitle>
            {adventure.tagline && (
              <CardDescription className="italic">
                {adventure.tagline}
              </CardDescription>
            )}
          </CardHeader>
          {adventure.summary && (
            <CardContent>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {adventure.summary}
              </p>
            </CardContent>
          )}
          <CardFooterLayout
            creator={adventure.creator}
            reactionsSlot={
              <EntityReactions entityType="adventure" entityId={adventure.id} />
            }
            actionsSlot={
              adventure.visibility === "private" && (
                <Badge variant="default" className="h-6">
                  Private
                </Badge>
              )
            }
          />
        </Card>
      ))}
    </div>
  );
}
