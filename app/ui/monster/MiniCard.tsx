import clsx from "clsx";
import { Crown } from "lucide-react";
import type React from "react";
import { Card as ShadcnCard } from "@/components/ui/card";
import type { Monster } from "@/lib/types";
import { ArmorStat, HPStat } from "./Stat";
import { Link } from "@/components/app/Link";

const HeaderStandard: React.FC<{
  monster: Monster;
}> = ({ monster }) => (
  <div className="flex gap-1 items-center">
    <div className="flex-1 font-slab font-black small-caps italic">
      {monster.legendary && (
        <Crown className="h-4 w-4 inline align-baseline mr-1 stroke-flame" />
      )}
      <Link href={`/m/${monster.id}`} className="text-xl">
        {monster.name}
      </Link>{" "}
      <span className="ml-1 text-muted-foreground text-sm font-condensed small-caps not-italic text-nowrap">
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

interface MiniCardProps {
  monster: Monster;
}

export const MiniCard = ({ monster }: MiniCardProps) => {
  return (
    <div className={clsx(monster.legendary && "md:col-span-2")}>
      <ShadcnCard className="gap-4 py-1 px-4">
        <HeaderStandard monster={monster} />
      </ShadcnCard>
    </div>
  );
};
