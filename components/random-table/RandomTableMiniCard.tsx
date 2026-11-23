"use client";

import { Link } from "@/components/layout/Link";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { RandomTableMini } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getRandomTableUrl } from "@/lib/utils/url";

interface RandomTableMiniCardProps {
  randomTable: RandomTableMini;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function RandomTableMiniCard({
  randomTable,
  selectable = false,
  selected = false,
  onSelect,
}: RandomTableMiniCardProps) {
  const card = (
    <Card
      className={cn(selectable && selected && "ring-2 ring-amber-500")}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <CardHeader>
        <CardTitle className="font-slab small-caps font-bold text-2xl">
          {selectable ? (
            <span className="block">{randomTable.name}</span>
          ) : (
            <Link href={getRandomTableUrl(randomTable)} className="block">
              {randomTable.name}
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardFooterLayout
        className={cn(selectable && "relative z-20")}
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

  if (selectable) {
    return (
      <div
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
      >
        <button
          type="button"
          aria-label={`Select ${randomTable.name}`}
          aria-pressed={selected}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          onClick={onSelect}
        />
        {card}
      </div>
    );
  }

  return card;
}
