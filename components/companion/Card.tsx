"use client";

import { Circle, Skull } from "lucide-react";
import type React from "react";
import { EntityReactions } from "@/components/EntityReactions";
import { Link } from "@/components/layout/Link";
import { CardTab, flagTallBand } from "@/components/monster/MonsterCardHeader";
import { MonsterImage } from "@/components/monster/MonsterImage";
import { HPStat, SavesStat } from "@/components/monster/Stat";
import { PaperforgeLink } from "@/components/paperforge/PaperforgeLink";
import { AbilityOverlay } from "@/components/shared/AbilityOverlay";
import { ActionsList } from "@/components/shared/ActionsList";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import { PrefixedFormattedText } from "@/components/shared/FormattedText";
import { MoreInfoSection } from "@/components/shared/MoreInfoSection";
import {
  ShareMenu,
  ShareMenuCopyURLItem,
  ShareMenuDownloadCardItem,
} from "@/components/shared/ShareMenu";
import { CardContentWithGap } from "@/components/shared/StyledComponents";
import { Card as ShadcnCard } from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import { PAPERFORGE_ENTRIES } from "@/lib/paperforge-catalog";
import type { MonsterSize } from "@/lib/services/monsters";
import type { Companion, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCompanionImageUrl, getCompanionUrl } from "@/lib/utils/url";

const formatCompanionSize = (size: MonsterSize): string =>
  size !== "medium" ? size.charAt(0).toUpperCase() + size.slice(1) : "";

const HeaderCompanion: React.FC<{
  companion: Companion;
  link?: boolean;
}> = ({ companion, link = true }) => {
  const hasArtwork = !!companion.paperforgeId;
  const descriptor = [
    [formatCompanionSize(companion.size), companion.kind]
      .filter(Boolean)
      .join(" "),
    companion.class,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div data-slot="card-header" className="group space-y-3">
      <div
        ref={flagTallBand}
        className="relative -mt-3 flex items-center rounded-t-xl border-b bg-muted px-2 py-1.5"
      >
        <div
          className={cn("w-full font-slab font-black", hasArtwork && "pr-20")}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <HPStat value={`${companion.hp_per_level}/LVL`} />
            {companion.saves && (
              <SavesStat className="max-w-full">
                <span className="sr-only">Saves:</span>{" "}
                <span className="min-w-0 wrap-anywhere">{companion.saves}</span>
              </SavesStat>
            )}
          </div>
        </div>
        {hasArtwork && (
          <MonsterImage
            paperforgeId={companion.paperforgeId}
            size={88}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 size-22"
          />
        )}
      </div>
      <div className="min-w-0 px-4">
        {hasArtwork && (
          <div
            aria-hidden
            className="float-right h-5 w-18 group-data-band-tall:hidden"
          />
        )}
        <h3 className="font-slab font-bold wrap-anywhere small-caps text-2xl/6">
          {link && companion.id ? (
            <Link href={getCompanionUrl(companion)}>{companion.name}</Link>
          ) : (
            companion.name
          )}
        </h3>
        {descriptor && (
          <div className="mt-1 text-sm/4 font-condensed text-muted-foreground small-caps">
            {descriptor}
          </div>
        )}
      </div>
    </div>
  );
};

interface CardProps {
  companion: Companion;
  creator: User;
  link?: boolean;
  hideActions?: boolean;
  hideDescription?: boolean;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const Card = ({
  companion,
  creator,
  link = true,
  hideActions = false,
  hideDescription = false,
  className,
  selectable = false,
  selected = false,
  onSelect,
}: CardProps) => {
  const { allConditions } = useConditions({
    creatorId: creator.discordId,
  });
  const paperforgeEntry = PAPERFORGE_ENTRIES.find(
    (e) => e.id === companion.paperforgeId
  );

  const card = (
    <ShadcnCard
      className={cn(
        "gap-3 py-3",
        className,
        selectable && selected && "ring-2 ring-amber-500"
      )}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <HeaderCompanion companion={companion} link={!selectable && link} />

      <CardContentWithGap className={cn(selectable && "pointer-events-none")}>
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
          <strong className={cn("font-sans text-xs")}>WOUNDS:</strong>
          {Array.from({ length: companion.wounds }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: these are stateless wound markers
            <Circle key={`${companion.id}-wound-${i}`} className="w-6 h-6" />
          ))}
          <Skull className="w-6 h-6" />
        </div>

        {hideDescription || (
          <MoreInfoSection
            moreInfo={companion.moreInfo}
            conditions={allConditions}
          />
        )}
      </CardContentWithGap>

      <CardFooterLayout
        creator={creator}
        source={companion.source}
        awards={companion.awards}
        hideActions={selectable || hideActions}
        separatorClassName="-mt-1"
        className={cn("-my-1", selectable && "relative z-40")}
        reactionsSlot={
          companion.id && (
            <EntityReactions
              entityType="companion"
              entityId={companion.id}
              likeCount={companion.likeCount}
            />
          )
        }
        actionsSlot={
          companion.id && (
            <ShareMenu disabled={companion.visibility !== "public"}>
              <ShareMenuDownloadCardItem
                name={`${companion.name}.png`}
                path={getCompanionImageUrl(companion)}
              />
              <ShareMenuCopyURLItem
                path={getCompanionUrl(companion)}
                updatedAt={companion.updatedAt}
              />
            </ShareMenu>
          )
        }
        paperforgeSlot={
          paperforgeEntry && <PaperforgeLink entry={paperforgeEntry} />
        }
      />
    </ShadcnCard>
  );

  if (selectable) {
    return (
      <div
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
        id={`companion-${companion.id}`}
      >
        <button
          type="button"
          aria-label={`Select ${companion.name}`}
          aria-pressed={selected}
          className="absolute inset-0 z-30 rounded-xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          onClick={onSelect}
        />
        <CardTab hasArtwork={!!companion.paperforgeId}>
          Adventuring Companion
        </CardTab>
        {card}
      </div>
    );
  }

  return (
    <div id={`companion-${companion.id}`}>
      <CardTab hasArtwork={!!companion.paperforgeId}>
        Adventuring Companion
      </CardTab>
      {card}
    </div>
  );
};
