"use client";
import { Bird, Shuffle, Skull } from "lucide-react";
import type React from "react";
import { Fragment } from "react";
import { EntityReactions } from "@/components/EntityReactions";
import { Link } from "@/components/layout/Link";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  getHeaderLayout,
  MonsterCardHeader,
  MonsterCardLevelTab,
} from "@/components/monster/MonsterCardHeader";
import { MonsterCardMetadata } from "@/components/monster/MonsterCardMetadata";
import { MonsterImage } from "@/components/monster/MonsterImage";
import { PaperforgeLink } from "@/components/paperforge/PaperforgeLink";
import { AbilityOverlay } from "@/components/shared/AbilityOverlay";
import { ActionsList } from "@/components/shared/ActionsList";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/shared/FormattedText";
import { MoreInfoSection } from "@/components/shared/MoreInfoSection";
import { CardContentWithGap } from "@/components/shared/StyledComponents";
import { Card as ShadcnCard } from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import { PAPERFORGE_ENTRIES } from "@/lib/paperforge-catalog";
import type {
  MonsterFormState,
  MonsterTeamMember,
} from "@/lib/services/monsters";
import { showsActionDamage } from "@/lib/text";
import type { Condition, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatHp } from "@/lib/utils/monster";
import { getMonsterUrl, getUserUrl } from "@/lib/utils/url";
import CardActions from "./CardActions";
import { ArmorStat, HPStat, SavesStat } from "./Stat";

const MemberStats: React.FC<{ member: MonsterTeamMember }> = ({ member }) => (
  <div className="flex gap-2 items-center justify-end font-slab font-black shrink-0">
    {member.armor === "medium" && <ArmorStat value="M" />}
    {member.armor === "heavy" && <ArmorStat value="H" />}
    {(member.hp > 0 || member.hpPerHero != null) && (
      <HPStat value={formatHp(member)} />
    )}
    {member.saves && <SavesStat>{member.saves}</SavesStat>}
  </div>
);

const MemberBlock: React.FC<{
  member: MonsterTeamMember;
  conditions: Condition[];
  noInteractive?: boolean;
}> = ({ member, conditions, noInteractive = false }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between items-center gap-2">
      <div className="flex items-center gap-2">
        {(member.paperforgeId || member.customArtwork) && (
          <MonsterImage
            paperforgeId={member.paperforgeId}
            customArtwork={member.customArtwork}
            className="-ml-6 size-20 shrink-0"
            size={80}
          />
        )}
        <div>
          <div className="font-slab font-bold small-caps text-2xl/6">
            {member.name}
          </div>
          {member.size !== "medium" && (
            <div className="text-sm/4 font-condensed text-muted-foreground small-caps">
              {member.size.charAt(0).toUpperCase() + member.size.slice(1)}
            </div>
          )}
        </div>
      </div>
      <MemberStats member={member} />
    </div>
    {member.abilities.length > 0 && (
      <AbilityOverlay
        abilities={member.abilities}
        conditions={conditions}
        noInteractive={noInteractive}
      />
    )}
    <ActionsList
      actions={member.actions}
      conditions={conditions}
      actionPreface={member.actionPreface || ""}
      noInteractive={noInteractive}
    />
  </div>
);

const MemberDivider: React.FC = () => (
  <div className="flex items-center gap-3" aria-hidden="true">
    <div className="h-px grow bg-border" />
    <div className="size-2.5 rotate-45 border border-border-strong" />
    <div className="h-px grow bg-border" />
  </div>
);

interface CardProps {
  monster: MonsterFormState;
  creator?: User;
  link?: boolean;
  noInteractive?: boolean;
  hideActions?: boolean;
  hideDescription?: boolean;
  showEncounterGuidelines?: boolean;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const Card = ({
  monster,
  creator,
  link = true,
  noInteractive = false,
  hideActions = false,
  hideDescription = false,
  showEncounterGuidelines = false,
  className,
  selectable = false,
  selected = false,
  onSelect,
}: CardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: creator?.discordId,
  });
  const paperforgeEntry = PAPERFORGE_ENTRIES.find(
    (e) => !monster.customArtwork && e.id === monster.paperforgeId
  );
  const artworkCredits = [
    { key: "monster", name: undefined, artwork: monster.customArtwork },
    ...(monster.members ?? []).map((member) => ({
      key: member.id,
      name: member.name,
      artwork: member.customArtwork,
    })),
  ].filter(({ artwork }) => artwork?.artist);
  const isTeam = (monster.members?.length ?? 0) > 0;
  const hasAbilities =
    (monster.families?.some((family) => family.abilities.length > 0) ??
      false) ||
    (monster.abilities?.length ?? 0) > 0;
  // The header's medallion can hang into the first lines of text below it.
  // Its text sits 0.5rem inside the ability block, so it needs that much less.
  const wrapsAroundMedallion = getHeaderLayout(monster).artworkBesideName;
  const abilityLeading = wrapsAroundMedallion && (
    <div
      aria-hidden
      className="float-right w-18 h-[calc(var(--medallion-overlap,0px)-0.5rem)]"
    />
  );
  const actionLeading = wrapsAroundMedallion && (
    <div aria-hidden className="float-right w-18 h-(--medallion-overlap,0px)" />
  );
  const showBloodied = !monster.hazard && !monster.minion && !!monster.bloodied;
  const showLastStand = (monster.legendary || isTeam) && !!monster.lastStand;
  const preventNonDiceInteraction = (event: React.MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest("[data-dice-notation]")) return;
    if (
      !event.target.closest(
        'a, button, [role="button"], [role="link"], [data-state]'
      )
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const card = (
    <ShadcnCard
      className={cn(
        className,
        selectable && selected && "ring-2 ring-amber-500"
      )}
      onClickCapture={noInteractive ? preventNonDiceInteraction : undefined}
      {...(selectable && selected && { "data-selected": "" })}
    >
      <MonsterCardHeader
        monster={monster}
        link={!selectable && link && !noInteractive}
      />

      <CardContentWithGap className={cn(selectable && "pointer-events-none")}>
        {hasAbilities && (
          <AbilityOverlay
            conditions={conditions}
            abilities={[
              ...(monster.families?.flatMap((f) => f.abilities) ?? []),
              ...(monster.abilities ?? []),
            ]}
            families={monster.families ?? []}
            noInteractive={noInteractive}
            leading={abilityLeading || undefined}
          />
        )}
        <ActionsList
          actions={monster.actions ?? []}
          conditions={conditions}
          actionPreface={monster.actionPreface}
          showDamage={showsActionDamage(monster)}
          noInteractive={noInteractive}
          leading={hasAbilities ? undefined : actionLeading || undefined}
        />
        {isTeam &&
          monster.members?.map((member) => (
            <Fragment key={member.id}>
              <MemberBlock
                member={member}
                conditions={conditions}
                noInteractive={noInteractive}
              />
              <MemberDivider />
            </Fragment>
          ))}
        {(showBloodied || showLastStand) && (
          <div className="flex flex-col">
            {showBloodied && monster.bloodied && (
              <PrefixedFormattedText
                content={monster.bloodied}
                conditions={conditions}
                prefix={<strong>BLOODIED:</strong>}
                noInteractive={noInteractive}
              />
            )}
            {showLastStand && monster.lastStand && (
              <PrefixedFormattedText
                content={monster.lastStand}
                conditions={conditions}
                prefix={<strong>LAST STAND:</strong>}
                noInteractive={noInteractive}
              />
            )}
          </div>
        )}

        {hideDescription || (
          <MoreInfoSection
            moreInfo={monster.moreInfo}
            conditions={conditions}
            noInteractive={noInteractive}
          />
        )}

        {showEncounterGuidelines && monster.mild_encounter && (
          <div className="flex gap-2 italic text-muted-foreground">
            <Bird className="size-5 shrink-0 mt-0.5" />
            <FormattedText
              content={monster.mild_encounter}
              conditions={conditions}
              noInteractive={noInteractive}
            />
          </div>
        )}

        {showEncounterGuidelines && monster.spicy_encounter && (
          <div className="flex gap-2 italic text-muted-foreground">
            <Skull className="size-5 shrink-0 mt-0.5" />
            <FormattedText
              content={monster.spicy_encounter}
              conditions={conditions}
              noInteractive={noInteractive}
            />
          </div>
        )}

        {!selectable && !noInteractive && monster.remixedFrom && (
          <div className="flex gap-1 items-center text-center text-sm text-muted-foreground">
            <Shuffle className="size-3 stroke-muted-foreground" />
            remixed from{" "}
            <Link
              href={getMonsterUrl(monster.remixedFrom)}
              className="font-medium"
            >
              {monster.remixedFrom.name}
            </Link>
            {monster.creator.discordId !==
              monster.remixedFrom.creator.discordId && (
              <>
                <span> by </span>
                <Link
                  href={getUserUrl(monster.remixedFrom.creator)}
                  className="font-medium inline-flex items-baseline gap-0.5"
                >
                  <UserAvatar
                    user={monster.remixedFrom.creator}
                    size={14}
                    className="inline"
                  />
                  <span>{monster.remixedFrom.creator.displayName}</span>
                </Link>
              </>
            )}
          </div>
        )}
        {artworkCredits.length > 0 && (
          <div className="space-y-1 text-xs text-muted-foreground">
            {artworkCredits.map(({ key, name, artwork }) => (
              <p key={key}>
                {name && <>{name}: </>}Art by{" "}
                {artwork?.sourceUrl && !noInteractive ? (
                  <Link
                    href={artwork.sourceUrl}
                    external
                    className="text-muted-foreground underline"
                  >
                    {artwork.artist}
                  </Link>
                ) : (
                  artwork?.artist
                )}
              </p>
            ))}
          </div>
        )}
      </CardContentWithGap>

      <MonsterCardMetadata monster={monster} />
      <CardFooterLayout
        creator={creator}
        source={monster.source}
        awards={monster.awards}
        hideActions={selectable || hideActions}
        className={cn(selectable && "relative z-40")}
        disableLink={noInteractive}
        actionsSlot={<CardActions monster={monster} />}
        reactionsSlot={
          monster.id && (
            <EntityReactions
              entityType="monster"
              entityId={monster.id}
              likeCount={monster.likeCount}
            />
          )
        }
        paperforgeSlot={
          !noInteractive &&
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
        id={`monster-${monster.id}`}
      >
        <button
          type="button"
          aria-label={`Select ${monster.name}`}
          aria-pressed={selected}
          className="absolute inset-0 z-30 rounded-xl focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          onClick={onSelect}
        />
        <MonsterCardLevelTab monster={monster} />
        {card}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full",
        (monster.legendary || isTeam) && "md:col-span-2 print:col-span-2"
      )}
      id={`monster-${monster.id}`}
    >
      <MonsterCardLevelTab monster={monster} />
      {card}
    </div>
  );
};
