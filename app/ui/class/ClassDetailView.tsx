"use client";

import { Heart, Shield, Star, Swords } from "lucide-react";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";

import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/FormattedText";
import { DieFromNotation } from "@/components/icons/PolyhedralDice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Class, StatType, User } from "@/lib/types";
import { STAT_TYPES } from "@/lib/types";

const WEAPON_DISPLAY_NAMES: Record<string, string> = {
  blade: "Blades",
  stave: "Staves",
  wand: "Wands",
  simple: "Simple",
  martial: "Martial",
  melee: "Melee",
  ranged: "Ranged",
};

function formatWeapons(weapons: Class["weapons"]): string | null {
  const parts = [];
  if (weapons.kind?.length)
    parts.push(
      weapons.kind.map((k) => WEAPON_DISPLAY_NAMES[k] || k).join(", ")
    );
  if (weapons.type)
    parts.push(WEAPON_DISPLAY_NAMES[weapons.type] || weapons.type);
  if (weapons.range)
    parts.push(WEAPON_DISPLAY_NAMES[weapons.range] || weapons.range);
  return parts.length > 0 ? parts.join(" / ") : null;
}

interface ClassDetailViewProps {
  classEntity: Class;
  creator?: User | null;
  actionsSlot?: React.ReactNode;
}

export function ClassDetailView({
  classEntity,
  creator,
  actionsSlot,
}: ClassDetailViewProps) {
  const conditions = useConditions();

  const weaponText = formatWeapons(classEntity.weapons);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-slab uppercase">
          {classEntity.name}
        </CardTitle>
        {classEntity.description && (
          <FormattedText
            className="text-muted-foreground text-sm text-justify [&_p_~_p]:mt-0.5"
            content={classEntity.description}
            conditions={conditions.allConditions}
          />
        )}
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Combat Stats + Saves Overlay */}
        <div className="relative w-[calc(100%+3rem)] transform-[translateX(-1.5rem)] px-[1.5rem] py-3 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-sm space-y-3">
          <div className="flex flex-col items-center gap-3 text-sm">
            <div className="flex justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-bold">Hit Die</span>
                <div className="flex items-center">
                  <DieFromNotation
                    className="size-8 -mr-3 stroke-neutral-400 fill-none dark:stroke-neutral-500"
                    die={classEntity.hitDie}
                  />
                  <span className="text-xl font-bold">
                    {classEntity.hitDie}
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-center items-center gap-1.5">
                <span className="font-bold">HP</span>
                <div className="flex items-center">
                  <Heart className="size-8 -mr-3 stroke-neutral-300 fill-neutral-200 dark:stroke-neutral-600 dark:fill-neutral-700" />
                  <span className="text-xl font-bold">
                    {classEntity.startingHp}
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-center items-center gap-1.5">
                <span className="font-bold">Armor</span>
                <div className="flex items-center">
                  <Shield className="size-8 -mr-3 stroke-neutral-300 fill-neutral-200 dark:stroke-neutral-600 dark:fill-neutral-700" />
                  <span className="text-xl font-bold">
                    {classEntity.armor.length > 0
                      ? classEntity.armor
                          .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
                          .join(", ")
                      : "None"}
                  </span>
                </div>
              </div>
              {weaponText && (
                <div className="flex flex-col text-center items-center gap-1.5">
                  <span className="font-bold">Weapons</span>
                  <div className="flex items-center">
                    <Swords className="size-8 -mr-3 stroke-neutral-300 fill-neutral-200 dark:stroke-neutral-600 dark:fill-neutral-700" />
                    <span className="text-xl font-bold">{weaponText}</span>
                  </div>
                </div>
              )}
            </div>
            {classEntity.startingGear.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">Gear:</span>
                <span>{classEntity.startingGear.join(", ")}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            {STAT_TYPES.map((stat: StatType) => {
              const isKey = classEntity.keyStats.includes(stat);
              const save = classEntity.saves[stat];
              return (
                <div key={stat} className="flex items-center gap-0.5">
                  {isKey && (
                    <Star className="size-8 -mr-3 stroke-neutral-300 fill-neutral-200 dark:stroke-neutral-600 dark:fill-neutral-700" />
                  )}
                  <span className="text-xl font-bold uppercase">
                    {stat}
                    {save > 0 ? "+" : save < 0 ? "-" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Abilities */}
        {classEntity.levels.length > 0 &&
          classEntity.levels.map((levelData) => (
            <div key={levelData.level} className="space-y-1">
              <h5 className="font-stretch-condensed font-bold uppercase italic text-base text-muted-foreground">
                Level {levelData.level}
              </h5>
              <div className="space-y-1">
                {levelData.abilities.map((ability) => (
                  <div key={ability.id} className="text-base">
                    <PrefixedFormattedText
                      prefix={
                        <h6 className="font-semibold inline">
                          {ability.name}.
                        </h6>
                      }
                      content={ability.description}
                      conditions={conditions.allConditions}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </CardContent>

      <CardFooterLayout
        creator={creator || classEntity.creator}
        source={classEntity.source}
        awards={classEntity.awards}
        actionsSlot={
          <div className="flex items-center gap-2">
            {classEntity.visibility === "private" && (
              <Badge variant="default" className="h-6">
                Private
              </Badge>
            )}
            {actionsSlot}
          </div>
        }
      />
    </Card>
  );
}
