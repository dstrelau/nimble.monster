"use client";

import React from "react";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/FormattedText";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
  Card as UICard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Class, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getClassUrl } from "@/lib/utils/url";

const WEAPON_DISPLAY_NAMES: Record<string, string> = {
  blade: "Blades",
  stave: "Staves",
  wand: "Wands",
  simple: "Simple",
  martial: "Martial",
  melee: "Melee",
  ranged: "Ranged",
};

interface CardProps {
  classEntity: Class;
  creator?: User | null;
  link?: boolean;
  hideActions?: boolean;
  className?: string;
}

export function CharacterClassCard({
  classEntity,
  creator,
  link = true,
  className,
}: CardProps) {
  const conditions = useConditions();
  const cardContent = (
    <UICard className={className}>
      <CardHeader className={cn(classEntity.description && "pb-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex flex-col text-xl font-bold uppercase leading-tight text-center font-slab">
              <span className="text-4xl">{classEntity.name}</span>
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-6">
        {classEntity.description && (
          <FormattedText
            className="text-muted-foreground text-sm [&_p_~_p]:mt-0.5"
            content={classEntity.description}
            conditions={conditions.allConditions}
          />
        )}

        <div className="grid grid-cols-[40%_auto] gap-x-2 text-sm">
          <dl className="grid grid-cols-[40%_auto] gap-x-2">
            {[
              {
                label: "Key Stats:",
                value: classEntity.keyStats.join(", "),
              },
              {
                label: "Hit Die:",
                value: classEntity.hitDie,
              },
              {
                label: "Starting HP:",
                value: classEntity.startingHp,
              },
              {
                label: "Saves:",
                value: Object.entries(classEntity.saves)
                  .filter(([, value]) => value !== 0)
                  .map(([stat, value]) => `${stat}${value > 0 ? "+" : "-"}`)
                  .join(", "),
              },
            ].map(
              ({ label, value }) =>
                value && (
                  <React.Fragment key={label}>
                    <dt className="font-bold">{label}</dt>
                    <dd className="flex-1">{value}</dd>
                  </React.Fragment>
                )
            )}
          </dl>
          <dl className="grid grid-cols-[40%_auto] gap-2">
            <dt className="font-semibold">Armor:</dt>
            <dd>
              {classEntity.armor.length > 0
                ? classEntity.armor
                    .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
                    .join(", ")
                : "None"}
            </dd>

            {(classEntity.weapons.kind?.length ||
              classEntity.weapons.type ||
              classEntity.weapons.range) && (
              <>
                <dt className="font-semibold">Weapons:</dt>
                <dd>
                  {(() => {
                    const parts = [];
                    if (classEntity.weapons.kind?.length)
                      parts.push(
                        classEntity.weapons.kind
                          .map((k) => WEAPON_DISPLAY_NAMES[k] || k)
                          .join(", ")
                      );
                    if (classEntity.weapons.type)
                      parts.push(
                        WEAPON_DISPLAY_NAMES[classEntity.weapons.type] ||
                          classEntity.weapons.type
                      );
                    if (classEntity.weapons.range)
                      parts.push(
                        WEAPON_DISPLAY_NAMES[classEntity.weapons.range] ||
                          classEntity.weapons.range
                      );
                    return parts.join(" • ");
                  })()}
                </dd>
              </>
            )}

            {classEntity.startingGear.length > 0 && (
              <>
                <dt className="font-semibold">Starting Gear:</dt>
                <dd className="text-sm">
                  {classEntity.startingGear.join(", ")}
                </dd>
              </>
            )}
          </dl>
        </div>

        {classEntity.levels.length > 0 &&
          classEntity.levels.map((levelData) => (
            <div key={levelData.level} className="space-y-1">
              <h5 className="font-stretch-condensed font-bold uppercase italic text-sm text-muted-foreground">
                Level {levelData.level}
              </h5>
              <div className="space-y-1">
                {levelData.abilities.map((ability) => (
                  <div key={ability.id} className="text-sm">
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

        {classEntity.abilityLists.length > 0 && (
          <>
            <h4 className="font-stretch-condensed font-bold uppercase italic text-sm text-muted-foreground">
              Class Abilities
            </h4>
            {classEntity.abilityLists.map((list) => (
              <div key={list.id} className="space-y-2">
                <h5 className="font-semibold text-sm">{list.name}</h5>
                <FormattedText
                  className="text-sm [&_p_~_p]:mt-0.5"
                  content={list.description}
                  conditions={conditions.allConditions}
                />
                <div className="space-y-2 pl-3">
                  {list.items.map((item) => (
                    <div key={item.id} className="text-sm">
                      <PrefixedFormattedText
                        prefix={
                          <span className="font-semibold inline">
                            {item.name}.
                          </span>
                        }
                        content={item.description}
                        conditions={conditions.allConditions}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>

      <CardFooterLayout
        creator={creator || classEntity.creator}
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
    </UICard>
  );

  if (link) {
    return (
      <Link href={getClassUrl(classEntity)} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
