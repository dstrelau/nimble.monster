"use client";
import { Crown, EyeOff, PersonStanding } from "lucide-react";
import type { ReactNode } from "react";
import React from "react";
import { HPStat } from "@/app/ui/monster/Stat";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MonsterMini } from "@/lib/types";
import { cn, monstersSortedByLevelInt } from "@/lib/utils";
import { Link } from "./app/Link";
import { Level } from "./Level";
import { Separator } from "./ui/separator";

export const MonsterRow: React.FC<{
  monster: MonsterMini;
}> = ({ monster }) => (
  <div className="flex gap-1 items-center">
    <div className="flex-1 flex gap-1 items-center font-slab font-bold small-caps italic">
      {monster.legendary && (
        <Crown className="size-5 inline self-center stroke-flame" />
      )}
      {monster.minion && (
        <PersonStanding className="size-5 inline self-center stroke-flame" />
      )}
      {monster.visibility === "private" && (
        <EyeOff className="size-5 inline self-center stroke-flame" />
      )}
      <span>
        <Link
          href={`/m/${monster.id}`}
          className={cn(
            "text-lg mr-2",
            monster.visibility === "private" && "text-muted-foreground"
          )}
        >
          {monster.name}
        </Link>
        <span className="font-medium text-muted-foreground text-sm font-condensed small-caps not-italic text-nowrap">
          Lvl <Level level={monster.level} />
        </span>
      </span>
    </div>
    <div className="flex flex-wrap items-baseline justify-end font-slab font-black italic">
      {monster.minion || <HPStat value={monster.hp} className="min-w-14" />}
    </div>
  </div>
);

interface MonsterGroupMinisProps {
  name: string;
  href?: string;
  monsters?: MonsterMini[];
  children?: ReactNode;
  badge?: ReactNode;
  attribution?: ReactNode;
  visibleMonsterCount?: number;
  showAll?: boolean;
}

export const MonsterGroupMinis = ({
  name,
  href,
  monsters,
  children,
  badge,
  attribution,
  visibleMonsterCount = 5,
  showAll = false,
}: MonsterGroupMinisProps) => {
  const sortedMonsters = monstersSortedByLevelInt(monsters ?? []);
  const visibleMonsters = showAll
    ? sortedMonsters
    : sortedMonsters?.slice(0, visibleMonsterCount);
  const remainingCount =
    !showAll && monsters && monsters.length > visibleMonsterCount
      ? monsters.length - visibleMonsterCount
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-condensed font-bold text-2xl flex items-center gap-2">
          {href ? <Link href={href}>{name}</Link> : name}
        </CardTitle>
        {attribution && <CardDescription>{attribution}</CardDescription>}
        {badge && <CardAction>{badge}</CardAction>}
        {children}
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex flex-col gap-1">
          {visibleMonsters?.map((monster, index) => (
            <React.Fragment key={monster.id}>
              <MonsterRow key={monster.id} monster={monster} />
              {index < visibleMonsters.length - 1 && <Separator />}
            </React.Fragment>
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
    </Card>
  );
};
