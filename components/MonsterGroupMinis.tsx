"use client";
import { Crown } from "lucide-react";
import type { ReactNode } from "react";
import { ArmorStat, HPStat } from "@/app/ui/monster/Stat";
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
import { Separator } from "./ui/separator";

const MonsterRow: React.FC<{
  monster: Monster;
}> = ({ monster }) => (
  <div className="flex gap-1 items-center">
    <div className="flex-1 font-slab font-black small-caps italic">
      {monster.legendary && (
        <Crown className="h-4 w-4 inline align-baseline mr-1 stroke-flame" />
      )}
      <Link href={`/m/${monster.id}`} className="text-lg">
        {monster.name}
      </Link>{" "}
      <span className="ml-1 font-medium text-muted-foreground text-sm font-condensed small-caps not-italic text-nowrap">
        Lvl {monster.level}
      </span>
    </div>
    <div className="flex flex-wrap items-baseline justify-end font-slab font-black italic">
      {monster.armor === "medium" && <ArmorStat value="M" />}
      {monster.armor === "heavy" && <ArmorStat value="H" />}
      <HPStat value={monster.hp} />
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
  const visibleMonsters = monsters?.slice(0, 10);
  const remainingCount =
    monsters && monsters.length > 10 ? monsters.length - 10 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-condensed font-normal text-2xl flex items-center gap-2">
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
              +{remainingCount} more
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
