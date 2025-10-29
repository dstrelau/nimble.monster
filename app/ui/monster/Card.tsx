"use client";
import { Users } from "lucide-react";
import type React from "react";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { ActionsList } from "@/app/ui/shared/ActionsList";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { MoreInfoSection } from "@/app/ui/shared/MoreInfoSection";
import { CardContentWithGap } from "@/app/ui/shared/StyledComponents";
import { Link } from "@/components/app/Link";
import { PrefixedFormattedText } from "@/components/FormattedText";
import { Level } from "@/components/Level";
import {
  CardDescription,
  CardTitle,
  Card as ShadcnCard,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Monster } from "@/lib/services/monsters";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatSizeKind } from "@/lib/utils/monster";
import { getFamilyUrl, getMonsterUrl } from "@/lib/utils/url";
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
import { StatsTooltip } from "./StatsTooltip";

const StatsGroup: React.FC<{
  monster: Monster;
  children: React.ReactNode;
  className?: string;
}> = ({ monster, children, className }) => {
  const tooltipLines: string[] = [];

  if (monster.armor !== "none")
    tooltipLines.push(
      `Armor: ${monster.armor.charAt(0).toUpperCase() + monster.armor.slice(1)}`
    );
  if (monster.swim) tooltipLines.push(`Swim: ${monster.swim}`);
  if (monster.fly) tooltipLines.push(`Fly: ${monster.fly}`);
  if (monster.climb) tooltipLines.push(`Climb: ${monster.climb}`);
  if (monster.burrow) tooltipLines.push(`Burrow: ${monster.burrow}`);
  if (monster.teleport) tooltipLines.push(`Teleport: ${monster.teleport}`);
  tooltipLines.push(`Speed: ${monster.speed}`);
  if (monster.hp) tooltipLines.push(`HP: ${monster.hp}`);
  if (monster.saves) tooltipLines.push(`Saves: ${monster.saves}`);

  return (
    <StatsTooltip tooltipLines={tooltipLines} className={className}>
      {children}
    </StatsTooltip>
  );
};

const MonsterTitle: React.FC<{
  monster: Monster;
  link?: boolean;
  variant: "legendary" | "minion" | "standard";
}> = ({ monster, link = true, variant }) => {
  const titleClasses = cn(
    "font-slab font-bold w-fit",
    variant === "legendary" ? "text-3xl" : "small-caps text-2xl"
  );

  return (
    <CardTitle className={titleClasses}>
      {link && monster.id ? (
        <Link href={getMonsterUrl(monster)}>{monster.name}</Link>
      ) : (
        monster.name
      )}
    </CardTitle>
  );
};

const MonsterDescription: React.FC<{
  monster: Monster;
  variant: "legendary" | "minion" | "standard";
}> = ({ monster, variant }) => {
  const descriptionClasses = cn(
    "font-condensed flex flex-wrap items-baseline gap-2",
    variant === "legendary" && "text-md font-slab font-normal",
    variant === "minion" && "small-caps col-span-2",
    variant === "standard" && "small-caps col-span-2"
  );

  const levelPrefix = variant === "legendary" ? "Level" : "Lvl";

  return (
    <CardDescription className={descriptionClasses}>
      <p>
        {levelPrefix} <Level level={monster.level} />{" "}
        {variant === "legendary" && "Solo "}
        {formatSizeKind(monster)}
        {variant === "minion" && " Minion"}
      </p>
      {monster.families.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {monster.families.map((family) => (
            <Link
              key={family.id}
              href={getFamilyUrl(family)}
              className="text-sm font-sans flex small-caps font-semibold"
            >
              <Users className="size-4 mr-1 text-flame" />
              <span>{family.name}</span>
            </Link>
          ))}
        </div>
      )}
    </CardDescription>
  );
};

const MonsterStats: React.FC<{
  monster: Monster;
  variant: "legendary" | "minion" | "standard";
  className?: string;
}> = ({ monster, variant, className }) => {
  const statsClasses =
    "font-slab font-black flex flex-wrap items-center justify-end min-w-fit";

  return (
    <StatsGroup className={className} monster={monster}>
      <div className={statsClasses}>
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
      </div>
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
    "gap-0 flex",
    variant === "minion" &&
      "has-data-[slot=card-action]:grid-cols-[2fr_1fr] gap-0"
  );

  return (
    <div
      data-slot="card-header"
      className={cn("@container/card-header gap-1.5 px-4 grow", headerClasses)}
    >
      <div className="w-fit">
        <MonsterTitle monster={monster} link={link} variant={variant} />
        <MonsterDescription monster={monster} variant={variant} />
      </div>
      <MonsterStats
        className="grow items-start justify-end"
        monster={monster}
        variant={variant}
      />
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
}

export const Card = ({
  monster,
  creator,
  link = true,
  hideActions = false,
  hideDescription = false,
  className,
}: CardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: creator?.discordId,
  });
  return (
    <div id={`monster-${monster.id}`}>
      <ShadcnCard className={className}>
        <MonsterHeader
          monster={monster}
          link={link}
          variant={
            monster.legendary
              ? "legendary"
              : monster.minion
                ? "minion"
                : "standard"
          }
        />

        <CardContentWithGap>
          {(monster.families.some((f) => f.abilities.length > 0) ||
            monster.abilities.length > 0) && (
            <AbilityOverlay
              conditions={conditions}
              abilities={[
                ...monster.families.flatMap((f) => f.abilities),
                ...monster.abilities,
              ]}
              families={monster.families}
            />
          )}

          <ActionsList
            actions={monster.actions}
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
        </CardContentWithGap>

        <CardFooterLayout
          creator={creator}
          source={monster.source}
          awards={monster.awards}
          hideActions={hideActions}
          actionsSlot={<CardActions monster={monster} />}
        />
      </ShadcnCard>
    </div>
  );
};
