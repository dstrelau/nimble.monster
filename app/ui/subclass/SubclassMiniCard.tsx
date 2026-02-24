"use client";

import { Link } from "@/components/app/Link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Subclass } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSubclassUrl } from "@/lib/utils/url";
import { CardFooterLayout } from "../shared/CardFooterLayout";

interface SubclassMiniCardProps {
  subclass: Subclass;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function SubclassMiniCard({
  subclass,
  className,
  selectable = false,
  selected = false,
  onSelect,
}: SubclassMiniCardProps) {
  const card = (
    <Card
      className={cn(
        className,
        selectable && selected && "ring-2 ring-amber-500"
      )}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <CardHeader>
        <CardTitle className={cn("font-slab small-caps font-bold text-2xl")}>
          {selectable ? (
            <span>
              {subclass.namePreface && `${subclass.namePreface} `}
              {subclass.name}
            </span>
          ) : (
            <Link href={getSubclassUrl(subclass)} className="block">
              {subclass.namePreface && `${subclass.namePreface} `}
              {subclass.name}
            </Link>
          )}
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">{subclass.className}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-col gap-1",
          selectable && "pointer-events-none"
        )}
      >
        {subclass.levels.map((level) => (
          <div
            key={level.level}
            className="flex gap-x-4 items-baseline text-base"
          >
            <span className="font-stretch-condensed font-bold uppercase italic text-base text-muted-foreground w-16 flex-shrink-0">
              Level {level.level}
            </span>
            <span className="font-semibold">
              {level.abilities.map((ability) => ability.name).join(", ")}
            </span>
          </div>
        ))}
      </CardContent>
      <CardFooterLayout
        className={cn(selectable && "pointer-events-none")}
        creator={subclass.creator}
        source={subclass.source}
        awards={subclass.awards}
        actionsSlot={
          subclass.visibility === "private" && (
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
      <button
        type="button"
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
        onClick={onSelect}
      >
        {card}
      </button>
    );
  }

  return card;
}
