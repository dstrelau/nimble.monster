"use client";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { Link } from "@/components/app/Link";
import { DiceNotation } from "@/components/DiceNotation";
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
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

const formatActions = (actions: number): string => {
  if (actions === 1) return "1 Action";
  return `${actions} Actions`;
};

const formatTierTarget = (
  tier: number,
  target: SpellSchool["spells"][0]["target"],
  utility?: boolean
): string => {
  const tierStr =
    tier === 0 && utility ? "" : tier === 0 ? "Cantrip" : `Tier ${tier}`;
  if (!target) return tierStr;

  const typeStr = {
    self: "Self",
    single: "Single Target",
    "single+": "Single Target+",
    multi: "Multi-Target",
    aoe: "AoE",
    special: "Special",
  }[target.type];

  if (!tierStr) return typeStr;
  return `${tierStr}, ${typeStr}`;
};

function SpellEntry({
  spell,
  mini,
  conditions,
  formatDistance,
}: {
  spell: SpellSchool["spells"][0];
  mini: boolean;
  conditions: ReturnType<typeof useConditions>;
  formatDistance: (
    target: SpellTarget | undefined,
    kind: "range" | "reach"
  ) => string | undefined;
}) {
  const parts = [
    ["Concentration", maybePeriod(spell.concentration), false],
    ["Range", formatDistance(spell.target, "range"), false],
    ["Reach", formatDistance(spell.target, "reach"), false],
    ["Damage", maybePeriod(spell.damage), false],
    [spell.reaction ? "Reaction" : "", maybePeriod(spell.description), true],
    ["Upcast", maybePeriod(spell.upcast), false],
    ["High Levels", maybePeriod(spell.highLevels), false],
  ].filter(([_, v]) => Boolean(v)) as [string, string, boolean][];

  return (
    <div>
      <div className="flex justify-between gap-6 items-baseline">
        <div className="gap-1">
          <h3 className="inline font-extrabold font-slab text-lg mr-1">
            {spell.name}
          </h3>
          <span className="text-sm text-muted-foreground italic text-nowrap">
            {formatTierTarget(spell.tier, spell.target, spell.utility)}
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
            <div key={label} className="space-y-0 inline overflow-auto">
              {label && (
                <strong className="mr-1 small-caps font-extrabold font-stretch-condensed italic">
                  {label}:
                </strong>
              )}
              {label === "Damage" ? (
                <span className="inline mr-1">
                  <DiceNotation text={value} />
                </span>
              ) : format ? (
                <FormattedText
                  content={value}
                  conditions={conditions.allConditions}
                  className="inline [&_div]:inline [&_p]:inline mr-1"
                />
              ) : (
                <div className="inline mr-1">{value}</div>
              )}
            </div>
          );
        })}
    </div>
  );
}

export function Card({
  spellSchool,
  creator,
  link = true,
  mini = false,
  className,
  selectable = false,
  selected = false,
  onSelect,
}: CardProps) {
  const conditions = useConditions();
  const effectiveLink = selectable ? false : link;

  const formatDistance = (
    target: SpellTarget | undefined,
    kind: "range" | "reach"
  ): string | undefined => {
    if (!target || target.type === "self") return undefined;
    if (target.distance == null) return undefined;
    if (kind === "reach" && target.kind === "line") {
      return `Line ${target.distance}.`;
    }
    if (kind === "reach" && target.kind === "cone") {
      return `Cone ${target.distance}.`;
    }
    return target.kind === kind ? `${target.distance}.` : undefined;
  };

  const card = (
    <UICard
      className={cn(
        className,
        selectable && selected && "ring-2 ring-amber-500"
      )}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <CardHeader>
        <CardTitle className="text-3xl font-bold uppercase leading-tight text-center font-slab">
          {effectiveLink ? (
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

      <CardContent className={cn(selectable && "pointer-events-none")}>
        <div className={cn(mini ? "space-y-1" : "space-y-6")}>
          {(() => {
            const regularSpells = spellSchool.spells.filter((s) => !s.utility);
            const utilitySpells = spellSchool.spells.filter((s) => s.utility);
            return (
              <>
                {regularSpells.map((spell) => (
                  <SpellEntry
                    key={spell.id}
                    spell={spell}
                    mini={mini}
                    conditions={conditions}
                    formatDistance={formatDistance}
                  />
                ))}
                {utilitySpells.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs text-muted-foreground italic uppercase tracking-wider">
                        Utility
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    {utilitySpells.map((spell) => (
                      <SpellEntry
                        key={spell.id}
                        spell={spell}
                        mini={mini}
                        conditions={conditions}
                        formatDistance={formatDistance}
                      />
                    ))}
                  </>
                )}
              </>
            );
          })()}
        </div>
      </CardContent>

      <CardFooterLayout
        className={cn(selectable && "pointer-events-none")}
        creator={creator || spellSchool.creator}
        source={spellSchool.source}
        awards={spellSchool.awards}
      />
    </UICard>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
        onClick={onSelect}
      >
        {card}
      </button>
    );
  }

  return card;
}
