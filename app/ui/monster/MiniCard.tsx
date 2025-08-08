import clsx from "clsx";
import React from "react";
import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  Card as ShadcnCard,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Monster, User } from "@/lib/types";
import { ArmorStat, HPStat, SavesStat } from "./Stat";
import Link from "next/link";

const HeaderLegendary: React.FC<{ monster: Monster }> = ({ monster }) => (
  <CardHeader>
    <CardTitle className="font-slab font-black italic text-4xl">
      {monster.name}
    </CardTitle>
    <CardDescription className="font-beaufort font-black text-lg leading-none tracking-tight">
      Level {monster.level} Solo{" "}
      {monster.size.charAt(0).toUpperCase() + monster.size.slice(1)}{" "}
      {monster.kind}
    </CardDescription>
    <CardAction>
      <div className="flex items-center justify-center font-slab font-black italic">
        {monster.armor === "medium" && <ArmorStat value="M" />}
        {monster.armor === "heavy" && <ArmorStat value="H" />}
        <HPStat value={monster.hp} />
        <SavesStat>
          <div className="flex flex-col">
            {monster.saves?.split(",").map((save, i, arr) => (
              <span key={save} className="block">
                {save}
                {i < arr.length - 1 && ", "}
              </span>
            ))}{" "}
          </div>
        </SavesStat>
      </div>
    </CardAction>
  </CardHeader>
);

const HeaderStandard: React.FC<{
  monster: Monster;
}> = ({ monster }) => (
  <div className="flex gap-1 items-center">
    <div className="grow-1 flex gap-1 items-baseline font-slab font-black small-caps italic">
      <Link href={`/m/${monster.id}`} className="text-xl">
        {monster.name}
      </Link>
      <span className="text-muted-foreground text-sm font-condensed small-caps">
        Lvl {monster.level}
      </span>
    </div>
    <div className="flex grow flex-wrap items-baseline justify-end font-slab font-black italic">
      {monster.armor === "medium" && <ArmorStat value="M" />}
      {monster.armor === "heavy" && <ArmorStat value="H" />}
      <HPStat value={monster.hp} />
    </div>
  </div>
);

interface MiniCardProps {
  monster: Monster;
}

export const MiniCard = ({ monster }: MiniCardProps) => {
  return (
    <div className={clsx(monster.legendary && "md:col-span-2")}>
      <ShadcnCard className="gap-4 py-0.5 px-2">
        {monster.legendary ? (
          <HeaderLegendary monster={monster} />
        ) : (
          <HeaderStandard monster={monster} />
        )}
      </ShadcnCard>
    </div>
  );
};
