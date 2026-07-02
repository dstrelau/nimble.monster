"use client";
import { useSession } from "next-auth/react";
import { Link } from "@/components/app/Link";
import { EncounterMonsterRow } from "@/components/EncounterMonsterRow";
import { FormattedText } from "@/components/FormattedText";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { EncounterOverview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getEncounterUrl } from "@/lib/utils/url";
import { CardFooterLayout } from "./shared/CardFooterLayout";

interface EncounterCardProps {
  encounter: EncounterOverview;
  limit?: number;
  onRemoveMonsterAction?: (id: string) => void;
  onQuantityChangeAction?: (id: string, quantity: number) => void;
  onIsPerHeroToggleAction?: (id: string, isPerHero: boolean) => void;
}

export const EncounterCard = ({
  encounter,
  limit = 7,
  onRemoveMonsterAction,
  onQuantityChangeAction,
  onIsPerHeroToggleAction,
}: EncounterCardProps) => {
  const sortedEntries = encounter.monsters
    .slice()
    .sort((a, b) => a.monster.levelInt - b.monster.levelInt);

  const visibleEntries = limit ? sortedEntries.slice(0, limit) : sortedEntries;
  const remainingCount = sortedEntries.length - visibleEntries.length;

  const href = encounter.id && getEncounterUrl(encounter);

  const { data: session } = useSession();
  const { allConditions: conditions } = useConditions({
    creatorId: session?.user.discordId,
  });
  const truncatedDescription = encounter.description
    ? encounter.description.length > 100
      ? `${encounter.description.slice(0, 100)}...`
      : encounter.description
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className={cn(
            "font-condensed font-bold text-2xl flex items-center gap-2"
          )}
        >
          {encounter.id ? (
            <Link href={href}>{encounter.name}</Link>
          ) : (
            `${encounter.name}`
          )}
        </CardTitle>
        {truncatedDescription && (
          <CardDescription>
            <FormattedText
              content={truncatedDescription}
              conditions={conditions}
            />
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1 justify-center">
          {visibleEntries.map((entry) => (
            <EncounterMonsterRow
              key={entry.monster.id}
              entry={entry}
              onRemove={onRemoveMonsterAction}
              onQuantityChange={onQuantityChangeAction}
              onIsPerHeroToggle={onIsPerHeroToggleAction}
            />
          ))}
          {remainingCount > 0 && (
            <div className="text-sm text-muted-foreground mt-2 text-center font-bold">
              {href ? (
                <Link className="text-muted-foreground" href={href}>
                  +{remainingCount} more
                </Link>
              ) : (
                <span>+{remainingCount} more</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooterLayout
        creator={encounter.creator}
        actionsSlot={
          encounter.visibility === "private" && (
            <Badge variant="default" className="h-6">
              Private
            </Badge>
          )
        }
      />
    </Card>
  );
};
