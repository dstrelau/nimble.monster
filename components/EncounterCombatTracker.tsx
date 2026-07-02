"use client";

import {
  ChevronRight,
  Crown,
  EyeOff,
  Heart,
  PersonStanding,
  Shield,
  Skull,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PaperforgeImage } from "@/components/PaperforgeImage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Encounter } from "@/lib/types";
import { cn, monstersSortedByLevelInt } from "@/lib/utils";
import { formatHp } from "@/lib/utils/monster";

type TrackedMonster = Encounter["monsters"][number]["monster"];

interface TrackerGroup {
  key: string;
  monster: TrackedMonster;
  hp: number;
  count: number;
}

function buildTrackerGroups(
  monsters: Encounter["monsters"],
  heroCount: number
): TrackerGroup[] {
  const entriesByMonsterId = new Map(
    monsters.map((entry) => [entry.monster.id, entry])
  );
  const sortedMonsters = monstersSortedByLevelInt(
    monsters.map((entry) => entry.monster)
  );

  return sortedMonsters.flatMap((monster) => {
    const entry = entriesByMonsterId.get(monster.id);
    if (!entry) return [];
    const count = entry.isPerHero ? entry.quantity * heroCount : entry.quantity;
    const hp =
      entry.monster.hpPerHero != null
        ? entry.monster.hpPerHero * heroCount
        : entry.monster.hp;
    return [{ key: monster.id, monster, hp, count }];
  });
}

const MAX_BOXES_PER_LINE = 4;

const HpTrackerBoxes = ({
  hp,
  filled,
  setFilled,
  hover,
  setHover,
}: {
  hp: number;
  filled: number;
  setFilled: React.Dispatch<React.SetStateAction<number>>;
  hover: number | null;
  setHover: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  const fullBoxCount = Math.floor(hp / 5);
  const remainder = hp % 5;
  const boxSegmentCounts = Array.from({ length: fullBoxCount }, () => 5);
  if (remainder > 0) boxSegmentCounts.push(remainder);

  const boxes = boxSegmentCounts.reduce<
    { segmentCount: number; startIndex: number }[]
  >((acc, segmentCount) => {
    const startIndex = acc.reduce((sum, b) => sum + b.segmentCount, 0);
    acc.push({ segmentCount, startIndex });
    return acc;
  }, []);

  const lines: (typeof boxes)[] = [];
  for (let i = 0; i < boxes.length; i += MAX_BOXES_PER_LINE) {
    lines.push(boxes.slice(i, i + MAX_BOXES_PER_LINE));
  }

  const previewLevel = hover === null ? filled : hover + 1;
  const lo = Math.min(filled, previewLevel);
  const hi = Math.max(filled, previewLevel);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: mouseleave only resets a pointer hover preview
    <div className="flex flex-col gap-1" onMouseLeave={() => setHover(null)}>
      {lines.map((line) => (
        <div key={line[0].startIndex} className="flex gap-1">
          {line.map((box) => (
            <div
              key={box.startIndex}
              className="flex h-4 shrink-0 rounded-sm border border-foreground/40 overflow-hidden"
            >
              {Array.from({ length: box.segmentCount }).map((_, j) => {
                const g = box.startIndex + j;
                return (
                  <button
                    key={g}
                    type="button"
                    aria-label={`Mark ${g + 1} HP`}
                    onMouseEnter={() => setHover(g)}
                    onClick={() =>
                      setFilled((prev) => (prev === g + 1 ? g : g + 1))
                    }
                    className={cn(
                      "w-1.5 cursor-pointer",
                      j < box.segmentCount - 1 &&
                        "border-r border-foreground/20",
                      g < lo && "bg-hp",
                      g >= lo && g < hi && "bg-hp/40"
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const TrackerGroupHeader = ({ monster }: { monster: TrackedMonster }) => (
  <div className="flex items-center gap-2">
    <div className="w-6 shrink-0 flex items-center justify-center">
      {monster.legendary && monster.paperforgeId ? (
        <div className="flex flex-col items-center">
          <Crown className="size-4 stroke-flame -mb-2" />
          <PaperforgeImage
            id={monster.paperforgeId}
            size={24}
            className="rounded-sm"
          />
        </div>
      ) : monster.paperforgeId ? (
        <PaperforgeImage
          id={monster.paperforgeId}
          size={24}
          className="rounded-sm"
        />
      ) : monster.legendary ? (
        <Crown className="size-4 stroke-flame" />
      ) : monster.minion ? (
        <PersonStanding className="size-4 stroke-flame" />
      ) : null}
    </div>
    {monster.visibility === "private" && (
      <EyeOff className="size-4 shrink-0 stroke-flame" />
    )}
    <span
      className={cn(
        "font-slab font-bold small-caps italic truncate",
        monster.visibility === "private" && "text-muted-foreground"
      )}
    >
      {monster.name}
    </span>
    {monster.armor !== "none" && (
      <span className="flex items-center gap-0.5 shrink-0 font-bold">
        <Shield className="size-4 stroke-neutral-400 fill-neutral-200 dark:stroke-neutral-500 dark:fill-neutral-700" />
        {monster.armor === "medium" ? "M" : "H"}
      </span>
    )}
    <span className="flex items-center gap-0.5 shrink-0 font-bold">
      <Heart className="size-4 stroke-hp fill-hp" />
      {formatHp(monster)}
    </span>
  </div>
);

const MinionTrackerBoxes = ({
  monster,
  count,
}: {
  monster: TrackedMonster;
  count: number;
}) => {
  const [dead, setDead] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setDead((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });

  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={`${monster.id}-${i}`}
          type="button"
          aria-label={`Toggle ${monster.name} ${i + 1}`}
          onClick={() => toggle(i)}
          className={cn(
            "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-foreground/40 text-sm font-slab font-black text-muted-foreground",
            dead.has(i) && "bg-hp/40"
          )}
        >
          {dead.has(i) ? <Skull className="size-4" /> : i + 1}
        </button>
      ))}
    </div>
  );
};

const MonsterHpRow = ({
  hp,
  index,
  showLabel,
}: {
  hp: number;
  index: number;
  showLabel: boolean;
}) => {
  const [filled, setFilled] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="flex h-5 w-4 shrink-0 items-center justify-end text-sm font-slab font-black text-muted-foreground">
          {filled >= hp ? <Skull className="size-4" /> : index + 1}
        </span>
      )}
      <HpTrackerBoxes
        hp={hp}
        filled={filled}
        setFilled={setFilled}
        hover={hover}
        setHover={setHover}
      />
    </div>
  );
};

const TrackerGroup = ({ monster, hp, count }: TrackerGroup) => (
  <div className="flex flex-col gap-1 py-2 border-b last:border-b-0">
    <TrackerGroupHeader monster={monster} />
    <div className="flex flex-col gap-1 pl-8">
      {monster.minion ? (
        <MinionTrackerBoxes monster={monster} count={count} />
      ) : (
        Array.from({ length: count }, (_, i) => (
          <MonsterHpRow
            key={`${monster.id}-${i}`}
            hp={hp}
            index={i}
            showLabel={count > 1}
          />
        ))
      )}
    </div>
  </div>
);

interface EncounterCombatTrackerProps {
  encounter: Encounter;
}

export function EncounterCombatTracker({
  encounter,
}: EncounterCombatTrackerProps) {
  const [open, setOpen] = useState(false);
  const groups = buildTrackerGroups(encounter.monsters, encounter.heroCount);

  useEffect(() => {
    const openForPrint = () => setOpen(true);
    window.addEventListener("beforeprint", openForPrint);
    return () => window.removeEventListener("beforeprint", openForPrint);
  }, []);

  if (groups.length === 0) return null;

  return (
    <Card className="gap-2 py-3">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-0">
          <CardHeader className="w-full flex-row items-center justify-between">
            <CardTitle className="font-condensed font-bold text-xl flex items-center gap-1.5">
              <ChevronRight
                className={cn(
                  "size-5 shrink-0 transition-transform",
                  open && "rotate-90"
                )}
              />
              Combat Tracker
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="flex flex-col pt-1">
            {groups.map((group) => (
              <TrackerGroup
                key={group.key}
                monster={group.monster}
                hp={group.hp}
                count={group.count}
              />
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
