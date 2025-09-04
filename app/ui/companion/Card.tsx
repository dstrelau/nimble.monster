"use client";
import { Circle, Skull } from "lucide-react";
import type React from "react";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { HPStat, SavesStat } from "@/app/ui/monster/Stat";
import { ActionsList } from "@/app/ui/shared/ActionsList";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { MoreInfoSection } from "@/app/ui/shared/MoreInfoSection";
import { CardContainer } from "@/app/ui/shared/StyledComponents";
import { Link } from "@/components/app/Link";
import { PrefixedFormattedText } from "@/components/FormattedText";
import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Companion, MonsterSize, User } from "@/lib/types";
import {
  ShareMenu,
  ShareMenuCopyURLItem,
  ShareMenuDownloadCardItem,
} from "@/components/ShareMenu";

// Helper function to format companion size
const formatCompanionSize = (size: MonsterSize): string => {
  return size !== "medium" ? size.charAt(0).toUpperCase() + size.slice(1) : "";
};

const HeaderCompanion: React.FC<{
  companion: Companion;
  link?: boolean;
}> = ({ companion, link = true }) => (
  <CardHeader>
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
    <CardDescription className="font-condensed text-md">
      {formatCompanionSize(companion.size)} {companion.kind} Adventuring
      Companion, {companion.class}
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
  creator: User;
  link?: boolean;
  hideActions?: boolean;
  hideCreator?: boolean;
  className?: string;
}

export const Card = ({
  companion,
  creator,
  link = true,
  hideActions = false,
  hideCreator = false,
  className,
}: CardProps) => {
  const { allConditions } = useConditions({
    creatorId: creator.discordId,
  });
  return (
    <div id={`companion-${companion.id}`}>
      <CardContainer className={className}>
        <HeaderCompanion companion={companion} link={link} />

        <CardContent className="flex flex-col gap-3 pt-0 pb-4">
          {companion.abilities.length > 0 && (
            <AbilityOverlay
              conditions={allConditions}
              abilities={companion.abilities}
            />
          )}

          <ActionsList
            actions={companion.actions}
            conditions={allConditions}
            actionPreface={companion.actionPreface}
          />

          {companion.dyingRule && (
            <PrefixedFormattedText
              prefix={<strong>Dying: </strong>}
              content={companion.dyingRule}
              conditions={allConditions}
            />
          )}

          <div className="flex items-center justify-center gap-1">
            <strong className="font-condensed text-xs">WOUNDS:</strong>
            {Array.from({ length: companion.wounds }, (_, i) => (
              <Circle key={`${companion.id}-wound-${i}`} className="w-6 h-6" />
            ))}
            <Skull className="w-6 h-6" />
          </div>

          <MoreInfoSection
            moreInfo={companion.moreInfo}
            conditions={allConditions}
          />
        </CardContent>

        <CardFooterLayout
          creator={creator}
          hideCreator={hideCreator}
          hideActions={hideActions}
          actionsSlot={
            <ShareMenu>
              <ShareMenuCopyURLItem path={`/c/${companion.id}`} />
              <ShareMenuDownloadCardItem
                name={`${companion.name}.png`}
                path={`/c/${companion.id}/image`}
              />
            </ShareMenu>
          }
        />
      </CardContainer>
    </div>
  );
};
