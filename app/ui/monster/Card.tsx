"use client";
import { Shuffle } from "lucide-react";
import type React from "react";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { ActionsList } from "@/app/ui/shared/ActionsList";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { MoreInfoSection } from "@/app/ui/shared/MoreInfoSection";
import { CardContentWithGap } from "@/app/ui/shared/StyledComponents";
import { Link } from "@/components/app/Link";
import { UserAvatar } from "@/components/app/UserAvatar";
import { PrefixedFormattedText } from "@/components/FormattedText";
import { Level } from "@/components/Level";
import { PaperforgeImage } from "@/components/PaperforgeImage";
import { PaperforgeLink } from "@/components/PaperforgeLink";
import { Card as ShadcnCard } from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import { PAPERFORGE_ENTRIES } from "@/lib/paperforge-catalog";
import type { Monster } from "@/lib/services/monsters";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatSizeKind } from "@/lib/utils/monster";
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
  monster: Monster;
  variant: "legendary" | "minion" | "standard";
  className?: string;
}> = ({ monster, variant, className }) => {
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

  const classes = "flex gap-1 items-center justify-end font-slab font-black";
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
          <HPStat value={monster.hp} />
          <SavesStat>
            <div className="flex flex-col">
              {monster.saves?.split(",").map((save) => (
                <span key={save} className="block">
                  {save}
                </span>
              ))}
            </div>
          </SavesStat>
        </>
      )}
      {variant === "standard" && <HPStat value={monster.hp} />}
    </StatsGroup>
  );
};

const MonsterHeader: React.FC<{
  monster: Monster;
  hiddenFamilyId?: string;
  link?: boolean;
  variant: "legendary" | "minion" | "standard";
}> = ({ monster, link = true, variant }) => {
  const headerClasses = cn(
    "gap-1 flex flex-col relative",
    monster.paperforgeId && "min-h-10",
    variant === "minion" &&
      "has-data-[slot=card-action]:grid-cols-[2fr_1fr] gap-0"
  );

  return (
    <div
      data-slot="card-header"
      className={cn("@container/card-header gap-1 px-4 grow", headerClasses)}
    >
      {monster.paperforgeId && (
        <PaperforgeImage
          id={monster.paperforgeId}
          className="absolute -top-7 -left-3 mr-2 size-19 z-10"
          size={76}
        />
      )}
      <div className="flex justify-between items-start">
        <div className={cn("basis-full", monster.paperforgeId && "ml-14")}>
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
                variant === "standard" && "small-caps"
              )}
            >
              {variant === "legendary" ? "Level" : "Lvl"}{" "}
              <Level level={monster.level} />{" "}
              {variant === "legendary" && "Solo "}
              {formatSizeKind(monster)}
            </div>
          </div>
        </div>
        <MonsterStats
          monster={monster}
          variant={variant}
          // className={cn(monster.paperforgeId && "ml-14")}
        />
      </div>
    </div>
  );
};

interface CardProps {
  monster: Monster;
  creator?: User;
  link?: boolean;
  hideActions?: boolean;
  hideDescription?: boolean;
  className?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export const Card = ({
  monster,
  creator,
  link = true,
  hideActions = false,
  hideDescription = false,
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

  const card = (
    <ShadcnCard
      className={cn(
        className,
        selectable && selected && "ring-2 ring-amber-500"
      )}
      data-selected={selectable && selected ? "" : undefined}
    >
      <MonsterHeader
        monster={monster}
        link={!selectable && link}
        variant={
          monster.legendary
            ? "legendary"
            : monster.minion
              ? "minion"
              : "standard"
        }
      />

      <CardContentWithGap className={cn(selectable && "pointer-events-none")}>
        {((monster.families?.some((f) => f.abilities.length > 0) ?? false) ||
          (monster.abilities?.length ?? 0) > 0) && (
          <AbilityOverlay
            conditions={conditions}
            abilities={[
              ...(monster.families?.flatMap((f) => f.abilities) ?? []),
              ...(monster.abilities ?? []),
            ]}
            families={monster.families ?? []}
          />
        )}
        <ActionsList
          actions={monster.actions ?? []}
          conditions={conditions}
          actionPreface={monster.actionPreface}
        />
        {monster.legendary && (
          <>
            {monster.bloodied && (
              <PrefixedFormattedText
                content={monster.bloodied}
                conditions={conditions}
                prefix={<strong>BLOODIED:</strong>}
              />
            )}

            {monster.lastStand && (
              <div>
                <PrefixedFormattedText
                  content={monster.lastStand}
                  conditions={conditions}
                  prefix={<strong>LAST STAND:</strong>}
                />
              </div>
            )}
          </>
        )}

        {hideDescription || (
          <MoreInfoSection
            moreInfo={monster.moreInfo}
            conditions={conditions}
          />
        )}

        {!selectable && monster.remixedFrom && (
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
        hideActions={selectable || hideActions}
        className={cn(selectable && "pointer-events-none")}
        actionsSlot={<CardActions monster={monster} />}
        paperforgeSlot={
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
    <div className="w-full" id={`monster-${monster.id}`}>
      {card}
    </div>
  );
};
