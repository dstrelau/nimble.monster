import { Circle, Skull } from "lucide-react";
import type React from "react";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { Attribution } from "@/app/ui/Attribution";
import { ActionsList } from "@/app/ui/shared/ActionsList";
import { InlineConditions } from "@/app/ui/shared/InlineConditions";
import { HPStat, SavesStat } from "@/app/ui/monster/Stat";
import { Link } from "@/components/app/Link";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Card as ShadcnCard,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WithConditionsTooltips } from "@/components/WithConditionsTooltips";
import type { Companion, MonsterSize, User } from "@/lib/types";
import { cn } from "@/lib/utils";

// Helper function to format companion size
const formatCompanionSize = (size: MonsterSize): string => {
  return size !== "medium" ? size.charAt(0).toUpperCase() + size.slice(1) : "";
};

const HeaderCompanion: React.FC<{
  companion: Companion;
  hideFamilyName?: boolean;
  link?: boolean;
}> = ({ companion, hideFamilyName = false, link = true }) => (
  <CardHeader className="gap-2 py-3">
    <CardAction>
      <div className="flex items-start justify-between">
        <div className="flex items-center font-slab font-black italic">
          <HPStat value={`${companion.hp_per_level}/LVL`} />
          <SavesStat>
            <span>{companion.saves}</span>
          </SavesStat>
        </div>
      </div>
    </CardAction>
    <CardDescription className="font-condensed small-caps text-sm">
      {formatCompanionSize(companion.size)} {companion.kind}, {companion.class}
    </CardDescription>

    <CardTitle className="font-slab font-black text-2xl leading-tight text-left">
      {link && companion.id ? (
        <Link href={`/c/${companion.id}`}>{companion.name}</Link>
      ) : (
        companion.name
      )}
    </CardTitle>
  </CardHeader>
);

interface CardProps {
  companion: Companion;
  creator?: User;
  isOwner?: boolean;
  link?: boolean;
  hideActions?: boolean;
  hideFamilyAbilities?: boolean;
  hideCreator?: boolean;
  hideFamilyName?: boolean;
  className?: string;
}

export const Card = ({
  companion,
  creator,
  isOwner = false,
  link = true,
  hideActions = false,
  hideFamilyAbilities = false,
  hideCreator = false,
  hideFamilyName = false,
  className,
}: CardProps) => {
  return (
    <div>
      <div id={`companion-${companion.id}`}>
        <ShadcnCard className={cn("gap-4 py-4", className)}>
          <HeaderCompanion
            companion={companion}
            hideFamilyName={hideFamilyName}
            link={link}
          />

          <CardContent className="flex flex-col gap-3 pt-0 pb-4">
            {companion.abilities.length > 0 && (
              <AbilityOverlay
                conditions={companion.conditions}
                abilities={companion.abilities}
              />
            )}

            <ActionsList
              actions={companion.actions}
              conditions={companion.conditions}
              actionPreface={companion.actionPreface}
            />

            <InlineConditions conditions={companion.conditions} />

            {companion.dyingRule && (
              <div className="font-condensed p-2 dark:shadow-sm">
                <p>
                  <strong className="font-condensed">Dying:</strong>{" "}
                  <WithConditionsTooltips
                    text={companion.dyingRule}
                    conditions={companion.conditions}
                  />
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-1">
              <strong className="font-condensed text-xs">WOUNDS:</strong>
              {Array.from({ length: companion.wounds }, (_, i) => (
                <Circle key={i} className="w-6 h-6" />
              ))}
              <Skull className="w-6 h-6" />
            </div>

            {companion.moreInfo && (
              <p className="italic">
                <WithConditionsTooltips
                  text={companion.moreInfo}
                  conditions={companion.conditions}
                />
              </p>
            )}
          </CardContent>

          {(!hideActions || !hideCreator) && (
            <>
              <Separator />
              <CardFooter className="flex-col items-stretch">
                <div className="flex items-center justify-between">
                  {creator && !hideCreator ? (
                    <Attribution user={creator} />
                  ) : (
                    <div />
                  )}
                </div>
              </CardFooter>
            </>
          )}
        </ShadcnCard>
      </div>
    </div>
  );
};
