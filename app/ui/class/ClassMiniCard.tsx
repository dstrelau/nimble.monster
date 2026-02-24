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
import { getClassAbilityListUrl, getClassUrl } from "@/lib/utils/url";
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

      <CardContent className="flex flex-col gap-1">
        <div className="text-base line-clamp-2">{classEntity.description}</div>
        {classEntity.abilityLists.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {classEntity.abilityLists.map((list) => (
              <Link key={list.id} href={getClassAbilityListUrl(list)}>
                <Badge variant="secondary">{list.name}</Badge>
              </Link>
            ))}
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
