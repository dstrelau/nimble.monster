"use client";
import { Table2 } from "lucide-react";
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
  limit = 4,
}: RandomTableCardProps) => {
  const { data: session } = useSession();
  const { allConditions: conditions } = useConditions({
    creatorId: session?.user.discordId,
  });

  const visibleSubtables = randomTable.subtables.slice(0, limit);
  const remainingCount = randomTable.subtables.length - visibleSubtables.length;
  const href = randomTable.id && getRandomTableUrl(randomTable);
  const remainingLabel = `+${remainingCount} more ${remainingCount === 1 ? "table" : "tables"}`;

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-3">
        <CardTitle className="flex items-start gap-2 font-condensed font-bold text-2xl leading-tight">
          <Table2 className="mt-1 size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">
            {randomTable.id ? (
              <Link href={href}>{randomTable.name}</Link>
            ) : (
              randomTable.name
            )}
          </span>
        </CardTitle>
        {randomTable.description && (
          <CardDescription className="line-clamp-2">
            <FormattedText
              content={randomTable.description}
              conditions={conditions}
              blockStyles={false}
            />
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ul className="divide-y rounded-lg border px-3">
          {visibleSubtables.map((subtable, index) => (
            <li
              key={subtable.id ?? `${subtable.title}-${index}`}
              className="flex items-start justify-between gap-3 py-3"
            >
              <p className="min-w-0 break-words font-semibold text-sm">
                {subtable.title}
              </p>
              <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                {subtable.rows.length}{" "}
                {subtable.rows.length === 1 ? "row" : "rows"}
              </span>
            </li>
          ))}
          {remainingCount > 0 && (
            <li className="py-2 text-muted-foreground text-xs">
              {href ? (
                <Link className="text-muted-foreground" href={href}>
                  {remainingLabel}
                </Link>
              ) : (
                <span>{remainingLabel}</span>
              )}
            </li>
          )}
        </ul>
      </CardContent>
      <CardFooterLayout
        creator={randomTable.creator}
        source={randomTable.source}
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
