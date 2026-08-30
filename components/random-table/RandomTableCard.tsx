"use client";
import { useSession } from "next-auth/react";
import { Link } from "@/components/layout/Link";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { FormattedText } from "@/components/shared/FormattedText";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { RandomTable } from "@/lib/types";
import { getRandomTableUrl } from "@/lib/utils/url";

interface RandomTableCardProps {
  randomTable: RandomTable;
  limit?: number;
}

export const RandomTableCard = ({
  randomTable,
  limit = 7,
}: RandomTableCardProps) => {
  const { data: session } = useSession();
  const { allConditions: conditions } = useConditions({
    creatorId: session?.user.discordId,
  });

  const visibleSubtables = randomTable.subtables.slice(0, limit);
  const remainingCount = randomTable.subtables.length - visibleSubtables.length;
  const href = randomTable.id && getRandomTableUrl(randomTable);

  const truncatedDescription = randomTable.description
    ? randomTable.description.length > 100
      ? `${randomTable.description.slice(0, 100)}...`
      : randomTable.description
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-condensed font-bold text-2xl">
          {randomTable.id ? (
            <Link href={href}>{randomTable.name}</Link>
          ) : (
            randomTable.name
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
        <div className="flex flex-col gap-1">
          {visibleSubtables.map((subtable, index) => (
            <div
              key={subtable.id ?? `${subtable.title}-${index}`}
              className="flex items-baseline justify-between gap-2 text-sm"
            >
              <span className="truncate font-condensed font-bold">
                {subtable.title}
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {subtable.notation}
              </span>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="mt-2 text-center font-bold text-muted-foreground text-sm">
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
        creator={randomTable.creator}
        actionsSlot={
          randomTable.visibility === "private" && (
            <Badge variant="default" className="h-6">
              Private
            </Badge>
          )
        }
      />
    </Card>
  );
};
