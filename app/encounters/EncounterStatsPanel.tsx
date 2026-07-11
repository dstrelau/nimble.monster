import { CircleAlert, Scale, Swords, TriangleAlert, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EncounterOverview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { monsterLevelValue } from "@/lib/utils/monster";

interface EncounterStatsPanelProps {
  encounter: EncounterOverview;
  onHeroCountChange?: (value: number) => void;
  onHeroLevelChange?: (value: number) => void;
}

const RATIO_VERY_LOW_THRESHOLD = 0.5;
const RATIO_LOW_THRESHOLD = 1.5;
const RATIO_HIGH_THRESHOLD = 3;
const RATIO_VERY_HIGH_THRESHOLD = 4;

type Difficulty = "Easy" | "Medium" | "Hard" | "Deadly" | "Very Deadly";

function difficultyForLevelPercent(percent: number): Difficulty {
  if (percent <= 60) return "Easy";
  if (percent <= 80) return "Medium";
  if (percent <= 100) return "Hard";
  if (percent <= 125) return "Deadly";
  return "Very Deadly";
}

const resolvedCount = (
  entry: EncounterOverview["monsters"][number],
  heroCount: number
) => (entry.isPerHero ? entry.quantity * heroCount : entry.quantity);

const SectionHeader = ({
  icon: Icon,
  label,
}: {
  icon: typeof Users;
  label: string;
}) => (
  <div className="flex items-center gap-2 font-condensed font-bold text-sm uppercase tracking-wide text-muted-foreground">
    <Icon className="size-4" />
    {label}
  </div>
);

const StatRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-slab font-black tabular-nums">{value}</span>
  </div>
);

export function EncounterStatsPanel({
  encounter,
  onHeroCountChange,
  onHeroLevelChange,
}: EncounterStatsPanelProps) {
  const editableHeroes = Boolean(onHeroCountChange && onHeroLevelChange);
  const {
    totalMonsterCount,
    totalMonsterLevel,
    totalMonsterHP,
    minionCount,
    nonMinionCount,
  } = encounter.monsters.reduce(
    (acc, entry) => {
      const count = resolvedCount(entry, encounter.heroCount);
      acc.totalMonsterCount += count;
      acc.totalMonsterLevel +=
        monsterLevelValue(entry.monster.levelInt) * count;
      acc.totalMonsterHP += entry.monster.hp * count;
      if (entry.monster.minion) {
        acc.minionCount += count;
      } else {
        acc.nonMinionCount += count;
      }
      return acc;
    },
    {
      totalMonsterCount: 0,
      totalMonsterLevel: 0,
      totalMonsterHP: 0,
      minionCount: 0,
      nonMinionCount: 0,
    }
  );
  const displayedTotalMonsterLevel = Number(totalMonsterLevel.toFixed(2));
  const totalHeroLevel = encounter.heroCount * encounter.heroLevel;

  const monsterToHeroRatio =
    encounter.heroCount > 0 ? nonMinionCount / encounter.heroCount : 0;
  const ratioWarning: {
    icon: typeof TriangleAlert;
    className: string;
    message: string;
  } | null =
    encounter.heroCount === 0
      ? null
      : monsterToHeroRatio > RATIO_VERY_HIGH_THRESHOLD
        ? {
            icon: CircleAlert,
            className: "text-destructive",
            message:
              "This monster:hero ratio is not recommended — fill out the encounter with minions instead.",
          }
        : monsterToHeroRatio > RATIO_HIGH_THRESHOLD
          ? {
              icon: TriangleAlert,
              className: "text-warning",
              message:
                "This encounter may be more difficult than its official difficulty would suggest.",
            }
          : monsterToHeroRatio < RATIO_VERY_LOW_THRESHOLD
            ? {
                icon: CircleAlert,
                className: "text-destructive",
                message:
                  "This monster:hero ratio is not recommended — use a legendary monster instead.",
              }
            : monsterToHeroRatio < RATIO_LOW_THRESHOLD
              ? {
                  icon: TriangleAlert,
                  className: "text-warning",
                  message:
                    "This encounter may be easier than its official difficulty would suggest.",
                }
              : null;

  const difficulty =
    totalHeroLevel > 0
      ? difficultyForLevelPercent((totalMonsterLevel / totalHeroLevel) * 100)
      : null;

  return (
    <Card>
      <CardContent className="flex flex-col divide-y">
        <div className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
          <SectionHeader icon={Users} label="Heroes" />
          <StatRow
            label="Count"
            value={
              editableHeroes ? (
                <span className="flex flex-1 items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    className="max-w-16 flex-1 font-sans font-normal tabular-nums"
                    value={encounter.heroCount}
                    onChange={(e) =>
                      onHeroCountChange?.(Math.max(1, Number(e.target.value)))
                    }
                  />
                  <span className="shrink-0 text-sm font-normal text-muted-foreground">
                    × LVL
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    className="max-w-16 flex-1 font-sans font-normal tabular-nums"
                    value={encounter.heroLevel}
                    onChange={(e) =>
                      onHeroLevelChange?.(
                        Math.max(1, Math.min(20, Number(e.target.value)))
                      )
                    }
                  />
                </span>
              ) : (
                `${encounter.heroCount} × LVL ${encounter.heroLevel}`
              )
            }
          />
          <StatRow label="Total Levels" value={totalHeroLevel} />
        </div>
        <div className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
          <SectionHeader icon={Swords} label="Monsters" />
          <StatRow
            label="Count"
            value={`${totalMonsterCount}${minionCount > 0 ? " (excl. minions)" : ""}`}
          />
          <StatRow label="Total Levels" value={displayedTotalMonsterLevel} />
          <StatRow
            label="Total HP"
            value={`${totalMonsterHP}${minionCount > 0 ? " (excl. minions)" : ""}`}
          />
        </div>
        <div className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
          <SectionHeader icon={Scale} label="Encounter" />
          <StatRow
            label="Monsters per Hero"
            value={
              <span className="flex items-center gap-1.5">
                {ratioWarning && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ratioWarning.icon
                        className={cn("size-4", ratioWarning.className)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{ratioWarning.message}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {Number(monsterToHeroRatio.toFixed(1))}:1
              </span>
            }
          />
          <StatRow label="Difficulty" value={difficulty ?? "—"} />
        </div>
      </CardContent>
    </Card>
  );
}
