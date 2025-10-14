"use client";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import { FormattedText } from "@/components/FormattedText";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Card as UICard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import { maybePeriod } from "@/lib/text";
import type { SpellSchool, SpellTarget, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getSpellSchoolUrl } from "@/lib/utils/url";

interface CardProps {
  spellSchool: SpellSchool;
  creator?: User | null;
  link?: boolean;
  mini?: boolean;
  className?: string;
}

const formatActions = (actions: number): string => {
  if (actions === 1) return "1 Action";
  return `${actions} Actions`;
};

const formatTierTarget = (
  tier: number,
  target: SpellSchool["spells"][0]["target"]
): string => {
  const tierStr = tier === 0 ? "Cantrip" : `Tier ${tier}`;
  if (!target) return tierStr;

  const typeStr = {
    self: "Self",
    single: "Single Target",
    "single+": "Single Target+",
    multi: "Multi-Target",
    aoe: "AoE",
    special: "Special",
  }[target.type];

  return `${tierStr}, ${typeStr}`;
};

export function Card({
  spellSchool,
  creator,
  link = true,
  mini = false,
  className,
}: CardProps) {
  const conditions = useConditions();

  const formatDistance = (
    target: SpellTarget | undefined,
    kind: "range" | "reach"
  ): string | undefined => {
    if (!target || target.type === "self") return undefined;
    if (kind === "reach" && target.kind === "line") {
      return `Line ${target.distance}.`;
    }
    if (kind === "reach" && target.kind === "cone") {
      return `Cone ${target.distance}.`;
    }
    return target.kind === kind ? `${target.distance}.` : undefined;
  };

  return (
    <UICard className={className}>
      <CardHeader>
        <CardTitle className="text-3xl font-bold uppercase leading-tight text-center font-slab">
          {link ? (
            <Link href={getSpellSchoolUrl(spellSchool)}>
              {spellSchool.name}
            </Link>
          ) : (
            spellSchool.name
          )}
        </CardTitle>
        {mini || (
          <CardDescription>
            {spellSchool.description && (
              <FormattedText
                className="text-center text-sm text-muted-foreground italic [&_p_~_p]:mt-0.5"
                content={spellSchool.description}
                conditions={conditions.allConditions}
              />
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className={cn(mini ? "space-y-1" : "space-y-6")}>
          {spellSchool.spells.map((spell) => {
            const parts = [
              ["Concentration", maybePeriod(spell.concentration), false],
              ["Range", formatDistance(spell.target, "range"), false],
              ["Reach", formatDistance(spell.target, "reach"), false],
              ["Damage", maybePeriod(spell.damage), false],
              [
                spell.reaction ? "Reaction" : "",
                maybePeriod(spell.description),
                true,
              ],
              ["Upcast", maybePeriod(spell.upcast), false],
              ["High Levels", maybePeriod(spell.highLevels), false],
            ].filter(([_, v]) => Boolean(v)) as [string, string, boolean][];

            return (
              <div key={spell.id}>
                <div className="flex justify-between">
                  <div className="items-baseline gap-1">
                    <h3 className="inline font-extrabold font-slab text-lg mr-1">
                      {spell.name}
                    </h3>
                    <span className="text-sm text-muted-foreground italic text-nowrap">
                      {formatTierTarget(spell.tier, spell.target)}
                    </span>
                  </div>
                  <span className="text-sm font-bold italic small-caps text-nowrap">
                    {" "}
                    {formatActions(spell.actions)}
                  </span>
                </div>

                {mini ||
                  parts.map(([label, value, format]) => {
                    return (
                      <div
                        key={label}
                        className="space-y-0 inline overflow-auto"
                      >
                        {label && (
                          <strong className="mr-1 small-caps font-extrabold font-stretch-condensed italic">
                            {label}:
                          </strong>
                        )}
                        {format ? (
                          <FormattedText
                            content={value || ""}
                            conditions={conditions.allConditions}
                            className="inline [&_div]:inline [&_p]:inline mr-1"
                          />
                        ) : (
                          <div className="inline mr-1">{value || ""}</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooterLayout creator={creator || spellSchool.creator} />
    </UICard>
  );
}
