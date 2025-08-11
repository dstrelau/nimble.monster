"use client";
import { Crown } from "lucide-react";
import type { ReactNode } from "react";
import { HPStat } from "@/app/ui/monster/Stat";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Monster } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Link } from "./app/Link";
import { Level } from "./Level";
import { Separator } from "./ui/separator";

const MonsterRow: React.FC<{
  monster: Monster;
}> = ({ monster }) => (
  <div className="flex gap-1 items-center">
    <div className="flex-1 flex gap-1 items-center font-slab font-bold small-caps italic">
      {monster.legendary && (
        <Crown className="h-5 w-5 inline self-center stroke-flame" />
      )}
      <span>
        <Link href={`/m/${monster.id}`} className="text-lg mr-2">
          {monster.name}
        </Link>
        <span className="font-medium text-muted-foreground text-sm font-condensed small-caps not-italic text-nowrap">
          Lvl <Level level={monster.level} />
        </span>
      </span>
    </div>
    <div className="flex flex-wrap items-baseline justify-end font-slab font-black italic">
      {/*{monster.armor === "medium" && <ArmorStat value="M" />}
      {monster.armor === "heavy" && <ArmorStat value="H" />}*/}
      <HPStat value={monster.hp} className="min-w-14" />
    </div>
  </div>
);

interface MonsterGroupMinis {
  name: string;
  href: string;
  monsters?: Monster[];
  children?: ReactNode;
  badge?: ReactNode;
  attribution?: ReactNode;
}

export const MonsterGroupMinis = ({
  name,
  href,
  monsters,
  children,
  badge,
  attribution,
}: MonsterGroupMinis) => {
  const visibleMonsterCount = 5;
  const visibleMonsters = monsters?.slice(0, visibleMonsterCount);
  const remainingCount =
    monsters && monsters.length > visibleMonsterCount
      ? monsters.length - visibleMonsterCount
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-condensed font-bold text-2xl flex items-center gap-2">
          <Link href={href}>{name}</Link>
        </CardTitle>
        {attribution && <CardDescription>{attribution}</CardDescription>}
        {badge && <CardAction>{badge}</CardAction>}
      </CardHeader>
      <CardContent>
        {children}
        <div className="relative">
          {visibleMonsters?.map((monster, index) => (
            <div
              key={monster.id}
              className={cn(
                "py-0.5 relative",
                monster.legendary && "md:col-span-2"
              )}
            >
              <MonsterRow monster={monster} />
              {index < visibleMonsters.length - 1 && <Separator />}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="text-sm text-muted-foreground mt-2 text-center font-bold">
              <Link className="text-muted-foreground" href={href}>
                +{remainingCount} more
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
