"use client";
import { Bird, Shuffle, Skull } from "lucide-react";
import type React from "react";
import { Fragment } from "react";
import { EntityReactions } from "@/components/EntityReactions";
import { Link } from "@/components/layout/Link";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { PaperforgeImage } from "@/components/paperforge/PaperforgeImage";
import { PaperforgeLink } from "@/components/paperforge/PaperforgeLink";
import { AbilityOverlay } from "@/components/shared/AbilityOverlay";
import { ActionsList } from "@/components/shared/ActionsList";
import { CardFooterLayout } from "@/components/shared/CardFooterLayout";
import {
  FormattedText,
  PrefixedFormattedText,
} from "@/components/shared/FormattedText";
import { Level } from "@/components/shared/Level";
import { MoreInfoSection } from "@/components/shared/MoreInfoSection";
import { CardContentWithGap } from "@/components/shared/StyledComponents";
import { Card as ShadcnCard } from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import { PAPERFORGE_ENTRIES } from "@/lib/paperforge-catalog";
import type {
  MonsterFormState,
  MonsterTeamMember,
} from "@/lib/services/monsters";
import type { Condition, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatHp, formatSizeKind } from "@/lib/utils/monster";
import { getMonsterUrl, getUserUrl } from "@/lib/utils/url";
import CardActions from "./CardActions";
import {
  ArmorStat,
  BurrowIcon,
  ClimbIcon,
  FlyIcon,
  HPStat,
  SavesStat,
  SpeedIcon,
  Stat,
  SwimIcon,
  TeleportIcon,
} from "./Stat";

const StatsGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

const MonsterStats: React.FC<{
  monster: MonsterFormState;
  variant: "hazard" | "legendary" | "minion" | "standard";
  className?: string;
}> = ({ monster, variant, className }) => {
  if (variant === "hazard") return null;

  let statCount = 0;

  if (monster.armor !== "none") statCount++;
  if (monster.swim) statCount++;
  if (monster.fly) statCount++;
  if (monster.climb) statCount++;
  if (monster.burrow) statCount++;
  if (monster.teleport) statCount++;
  if (variant !== "legendary" && monster.speed !== 6) statCount++;
  if (monster.hp) statCount++;
  if (monster.saves) statCount += 2;

  if (statCount === 0) return null;

  const classes = "flex gap-2 items-center justify-end font-slab font-black";
  return (
    <StatsGroup
      className={cn(
        statCount > 4 && variant !== "legendary" && "flex-wrap",
        variant === "legendary" && "shrink-0",
        classes,
        className
      )}
    >
      {(variant === "legendary" || variant === "standard") && (
        <>
          {monster.armor === "medium" && <ArmorStat value="M" />}
          {monster.armor === "heavy" && <ArmorStat value="H" />}
        </>
      )}
      {variant !== "legendary" && (
        <>
          <Stat name="swim" value={monster.swim} SvgIcon={SwimIcon} />
          <Stat name="fly" value={monster.fly} SvgIcon={FlyIcon} />
          <Stat name="climb" value={monster.climb} SvgIcon={ClimbIcon} />
          <Stat name="burrow" value={monster.burrow} SvgIcon={BurrowIcon} />
          <Stat
            name="teleport"
            value={monster.teleport}
            SvgIcon={TeleportIcon}
          />
          {monster.speed !== 6 && (
            <Stat
              name="speed"
              value={monster.speed}
              SvgIcon={SpeedIcon}
              showZero={true}
            />
          )}
        </>
      )}
      {variant === "legendary" && (
        <>
          <HPStat value={formatHp(monster)} />
          <SavesStat>{monster.saves}</SavesStat>
        </>
      )}
      {variant === "standard" && <HPStat value={formatHp(monster)} />}
    </StatsGroup>
  );
};

const MonsterHeader: React.FC<{
  monster: MonsterFormState;
  hiddenFamilyId?: string;
  link?: boolean;
  variant: "hazard" | "legendary" | "minion" | "standard";
}> = ({ monster, link = true, variant }) => {
  const headerClasses = cn(
    "gap-1 flex flex-col relative",
    monster.paperforgeId && "z-10 -ml-6",
    variant === "minion" &&
      "has-data-[slot=card-action]:grid-cols-[2fr_1fr] gap-0"
  );

  return (
    <div
      data-slot="card-header"
      className={cn("gap-1 px-4 grow", headerClasses)}
    >
      {monster.paperforgeId && (
        <PaperforgeImage
          id={monster.paperforgeId}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-22 z-20"
          size={88}
        />
      )}
      <div
        className={cn(
          "flex items-start",
          variant === "legendary"
            ? "flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0"
            : "justify-between"
        )}
      >
        <div className={cn("basis-full", monster.paperforgeId && "ml-24")}>
          <div className="space-x-1">
            <div
              className={cn(
                "font-slab font-bold inline",
                variant === "legendary" ? "text-3xl/8" : "small-caps text-2xl/6"
              )}
            >
              {link && monster.id ? (
                <Link href={getMonsterUrl(monster)}>{monster.name}</Link>
              ) : (
                monster.name
              )}
            </div>{" "}
            <div
              className={cn(
                "text-sm/4 font-condensed font-muted-foreground",
                variant === "legendary" && "text-md font-slab font-normal",
                variant === "minion" && "small-caps",
                (variant === "standard" || variant === "hazard") && "small-caps"
              )}
            >
              {monster.levelInt !== 0 && (
                <>
                  {variant === "legendary" ? "Level" : "Lvl"}{" "}
                  <Level level={monster.level} />{" "}
                </>
              )}
              {variant === "legendary" && "Solo "}
              {variant !== "hazard" && formatSizeKind(monster)}
            </div>
          </div>
        </div>
        <MonsterStats
          monster={monster}
          variant={variant}
          className={cn(variant === "legendary" && "self-end sm:self-auto")}
        />
      </div>
    </div>
  );
};

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
        {member.paperforgeId && (
          <PaperforgeImage
            id={member.paperforgeId}
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

const TeamHeader: React.FC<{ monster: MonsterFormState; link?: boolean }> = ({
  monster,
  link = true,
}) => (
  <div data-slot="card-header" className="gap-1 px-4 grow flex flex-col">
    <div className="space-x-1">
      <div className="font-slab font-bold inline text-3xl/8">
        {link && monster.id ? (
          <Link href={getMonsterUrl(monster)}>{monster.name}</Link>
        ) : (
          monster.name
        )}
      </div>{" "}
      <div className="text-md font-slab font-normal text-muted-foreground">
        {monster.levelInt !== 0 && (
          <>
            Level <Level level={monster.level} />{" "}
          </>
        )}
        {monster.kind}
      </div>
    </div>
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
    (e) => e.id === monster.paperforgeId
  );
  const isTeam = (monster.members?.length ?? 0) > 0;
  const hasAbilities =
    (monster.families?.some((family) => family.abilities.length > 0) ??
      false) ||
    (monster.abilities?.length ?? 0) > 0;
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
      {isTeam ? (
        <TeamHeader
          monster={monster}
          link={!selectable && link && !noInteractive}
        />
      ) : (
        <MonsterHeader
          monster={monster}
          link={!selectable && link && !noInteractive}
          variant={
            monster.hazard
              ? "hazard"
              : monster.legendary
                ? "legendary"
                : monster.minion
                  ? "minion"
                  : "standard"
          }
        />
      )}

      <CardContentWithGap
        className={cn(
          selectable && "pointer-events-none",
          monster.paperforgeId && !isTeam && !hasAbilities && "pt-4"
        )}
      >
        {hasAbilities && (
          <AbilityOverlay
            conditions={conditions}
            abilities={[
              ...(monster.families?.flatMap((f) => f.abilities) ?? []),
              ...(monster.abilities ?? []),
            ]}
            families={monster.families ?? []}
            noInteractive={noInteractive}
          />
        )}
        <ActionsList
          actions={monster.actions ?? []}
          conditions={conditions}
          actionPreface={monster.actionPreface}
          noInteractive={noInteractive}
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
        {!monster.hazard && !monster.minion && monster.bloodied && (
          <PrefixedFormattedText
            content={monster.bloodied}
            conditions={conditions}
            prefix={<strong>BLOODIED:</strong>}
            noInteractive={noInteractive}
          />
        )}

        {(monster.legendary || isTeam) && monster.lastStand && (
          <div>
            <PrefixedFormattedText
              content={monster.lastStand}
              conditions={conditions}
              prefix={<strong>LAST STAND:</strong>}
              noInteractive={noInteractive}
            />
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
      </CardContentWithGap>

      <CardFooterLayout
        creator={creator}
        source={monster.source}
        awards={monster.awards}
        hideActions={selectable || hideActions || noInteractive}
        className={cn(selectable && "pointer-events-none")}
        disableLink={noInteractive}
        actionsSlot={<CardActions monster={monster} />}
        reactionsSlot={
          <EntityReactions entityType="monster" entityId={monster.id} />
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
      <button
        type="button"
        className={cn(
          "w-full cursor-pointer relative text-left transition-[filter] duration-150 hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]",
          selected && "drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        )}
        id={`monster-${monster.id}`}
        onClick={onSelect}
      >
        {card}
      </button>
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
      {card}
    </div>
  );
};
