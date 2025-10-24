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
}

export function SubclassMiniCard({
  subclass,
  className,
}: SubclassMiniCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={cn("font-slab small-caps font-bold text-2xl")}>
          <Link href={getSubclassUrl(subclass)} className="block">
            {subclass.namePreface && `${subclass.namePreface} `}
            {subclass.name}
          </Link>
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">{subclass.className}</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        {subclass.levels.map((level) => (
          <div
            key={level.level}
            className="flex gap-x-4 items-baseline text-sm"
          >
            <span className="font-stretch-condensed font-bold uppercase italic text-sm text-muted-foreground w-16 flex-shrink-0">
              Level {level.level}
            </span>
            <span className="font-semibold">
              {level.abilities.map((ability) => ability.name).join(", ")}
            </span>
          </div>
        ))}
      </CardContent>
      <CardFooterLayout
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
}
