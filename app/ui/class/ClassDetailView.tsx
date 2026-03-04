"use client";

import {
  ArrowBigDown,
  ArrowBigUp,
  Heart,
  Shield,
  Star,
  Swords,
} from "lucide-react";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/FormattedText";
import { DieFromNotation } from "@/components/icons/PolyhedralDice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useConditions } from "@/lib/hooks/useConditions";
import { ARMOR_TYPES, type Class, type StatType, type User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeaponsDisplay } from "@/lib/utils/weapons";

const mutedIconClass =
  "size-8 -mr-2 stroke-neutral-400 dark:stroke-neutral-600 fill-neutral-400 dark:fill-neutral-600";

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

  const weaponText = formatWeaponsDisplay(classEntity.weapons);

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
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-6">
              {classEntity.keyStats.length > 0 && (
                <div className="flex flex-col text-center items-center gap-1.5">
                  <span className="font-normal">Key Stats</span>
                  <div className="flex items-center gap-1.5">
                    {classEntity.keyStats.map((stat) => (
                      <div key={stat} className="flex items-center">
                        <Star className={mutedIconClass} />
                        <span className="text-xl font-bold">{stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-normal">Hit Die</span>
                <div className="flex items-center">
                  <DieFromNotation
                    className={cn(mutedIconClass, "fill-none dark:fill-none")}
                    die={classEntity.hitDie}
                  />
                  <span className="text-xl font-bold">
                    {classEntity.hitDie}
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-center items-center gap-1.5">
                <span className="font-normal">HP</span>
                <div className="flex items-center">
                  <Heart className={mutedIconClass} />
                  <span className="text-xl font-bold">
                    {classEntity.startingHp}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {(Object.values(classEntity.saves) as number[]).some(
                (v) => v !== 0
              ) && (
                <div className="flex flex-col text-center items-center gap-1.5">
                  <span className="font-normal">Saves</span>
                  <div className="flex items-center gap-1.5">
                    {(Object.entries(classEntity.saves) as [StatType, number][])
                      .filter(([, v]) => v !== 0)
                      .map(([stat, value]) => (
                        <div key={stat} className="flex items-center">
                          {value > 0 ? (
                            <ArrowBigUp className={mutedIconClass} />
                          ) : (
                            <ArrowBigDown className={mutedIconClass} />
                          )}
                          <span className="text-xl font-bold">
                            {stat}
                            {value > 0 ? "+" : "–"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col text-center items-center gap-1.5">
                <span className="font-normal">Armor</span>
                <div className="flex items-center">
                  <Shield className={mutedIconClass} />
                  <span className="text-xl font-bold">
                    {classEntity.armor.length > 0
                      ? classEntity.armor.length === ARMOR_TYPES.length
                        ? "All"
                        : classEntity.armor
                            .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
                            .join(", ")
                      : "None"}
                  </span>
                </div>
              </div>
              {weaponText && (
                <div className="flex flex-col text-center items-center gap-1.5">
                  <span className="font-normal">Weapons</span>
                  <div className="flex items-center">
                    <Swords className={mutedIconClass} />
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
        </div>

        {/* Level Abilities */}
        {classEntity.levels.length > 0 &&
          classEntity.levels.map((levelData) => (
            <div key={levelData.level} className="flex gap-3">
              <div className="w-12 shrink-0 text-right">
                <span className="font-stretch-condensed font-bold uppercase italic text-base text-muted-foreground">
                  LVL {levelData.level}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                {levelData.abilities.map((ability) => (
                  <div key={ability.id} className="text-base">
                    <PrefixedFormattedText
                      prefix={<h6 className="font-semibold">{ability.name}</h6>}
                      content={ability.description}
                      conditions={conditions.allConditions}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

        {classEntity.abilityLists.length > 0 && <Separator />}

        {/* Class Options */}
        <div className="flex flex-col gap-10">
          {classEntity.abilityLists.map((list) => (
            <div key={list.id}>
              <div className="flex justify-center items-center gap-1.5 mb-2">
                <h5 className="text-2xl font-slab font-semibold">
                  {list.name}
                </h5>
              </div>
              {list.description && (
                <FormattedText
                  className="text-sm text-muted-foreground mb-3"
                  content={list.description}
                  conditions={conditions.allConditions}
                />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {list.items.map((item) => (
                  <div key={item.id} className="text-base">
                    <PrefixedFormattedText
                      prefix={<h6 className="font-semibold">{item.name}</h6>}
                      content={item.description}
                      conditions={conditions.allConditions}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
