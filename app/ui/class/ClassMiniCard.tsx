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
import type { Class } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getClassUrl } from "@/lib/utils/url";
import { CardFooterLayout } from "../shared/CardFooterLayout";

interface ClassMiniCardProps {
  classEntity: Class;
  className?: string;
}

export function ClassMiniCard({ classEntity, className }: ClassMiniCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={cn("font-slab small-caps font-bold text-2xl")}>
          <Link href={getClassUrl(classEntity)} className="block">
            {classEntity.name}
          </Link>
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">
            {classEntity.hitDie} | {classEntity.keyStats.join("/")}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-1">
        <div className="text-sm line-clamp-2">{classEntity.description}</div>
        {classEntity.levels.length > 0 && (
          <div className="text-sm text-muted-foreground mt-2">
            {classEntity.levels.length} level
            {classEntity.levels.length !== 1 ? "s" : ""} of abilities
          </div>
        )}
        {classEntity.abilityLists.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {classEntity.abilityLists.length} ability list
            {classEntity.abilityLists.length !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
      <CardFooterLayout
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
}
