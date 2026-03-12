"use client";

import { Star } from "lucide-react";
import { Link } from "@/components/app/Link";
import { DieFromNotation } from "@/components/icons/PolyhedralDice";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Class } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getClassUrl } from "@/lib/utils/url";
import { CardFooterLayout } from "../shared/CardFooterLayout";

interface ClassMiniCardProps {
  classEntity: Class;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function ClassMiniCard({
  classEntity,
  className,
  selectable = false,
  selected = false,
  onSelect,
}: ClassMiniCardProps) {
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
            <span className="block">{classEntity.name}</span>
          ) : (
            <Link href={getClassUrl(classEntity)} className="block">
              {classEntity.name}
            </Link>
          )}
        </CardTitle>
        <CardAction>
          <div className="flex gap-3 items-center">
            <div className="flex items-center">
              <DieFromNotation
                className="size-6 -mr-2 stroke-neutral-400 fill-none dark:stroke-neutral-500"
                die={classEntity.hitDie}
              />
              <span className="text-sm font-bold">{classEntity.hitDie}</span>
            </div>
            <div className="flex items-center">
              <Star className="size-5 -mr-1.5 stroke-neutral-300 fill-neutral-200 dark:stroke-neutral-600 dark:fill-neutral-700" />
              <span className="text-sm font-bold uppercase">
                {classEntity.keyStats.join(" ")}
              </span>
            </div>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-col gap-1",
          selectable && "pointer-events-none"
        )}
      >
        <div className="text-base line-clamp-2">{classEntity.description}</div>
      </CardContent>
      <CardFooterLayout
        className={cn(selectable && "pointer-events-none")}
        creator={classEntity.creator}
        source={classEntity.source}
        awards={classEntity.awards}
        actionsSlot={
          classEntity.visibility === "private" && (
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
