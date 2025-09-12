"use client";
import { Users } from "lucide-react";
import type React from "react";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { ActionsList } from "@/app/ui/shared/ActionsList";
import { CardFooterLayout } from "@/app/ui/shared/CardFooterLayout";
import { MoreInfoSection } from "@/app/ui/shared/MoreInfoSection";
import {
  CardContainer,
  CardContentWithGap,
} from "@/app/ui/shared/StyledComponents";
import { Link } from "@/components/app/Link";
import { PrefixedFormattedText } from "@/components/FormattedText";
import { Level } from "@/components/Level";
import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConditions } from "@/lib/hooks/useConditions";
import type { Monster, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatSizeKind } from "@/lib/utils/monster";
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
}> = ({ monster, children }) => {
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

  return <StatsTooltip tooltipLines={tooltipLines}>{children}</StatsTooltip>;
};

const HeaderLegendary: React.FC<{ monster: Monster; link?: boolean }> = ({
  monster,
  link = true,
}) => (
  <CardHeader>
    <CardTitle className="font-slab font-black italic text-4xl">
      {link ? (
        <Link href={`/m/${monster.id}`}>{monster.name}</Link>
      ) : (
        monster.name
      )}
    </CardTitle>
    <CardDescription className="font-beaufort font-black text-lg leading-none tracking-tight">
      Level <Level level={monster.level} className="text-lg" /> Solo{" "}
      {formatSizeKind(monster)}
    </CardDescription>
    <CardAction>
      <StatsGroup monster={monster}>
        <div className="flex items-center justify-center font-slab font-black italic">
          {monster.armor === "medium" && <ArmorStat value="M" />}
          {monster.armor === "heavy" && <ArmorStat value="H" />}
          <HPStat value={monster.hp} />
          <SavesStat>
            <div className="flex flex-col">
              {monster.saves?.split(",").map((save, i, arr) => (
                <span key={save} className="block">
                  {save}
                  {i < arr.length - 1 && ", "}
                </span>
              ))}{" "}
            </div>
          </SavesStat>
        </div>
      </StatsGroup>
    </CardAction>
  </CardHeader>
);

const HeaderMinion: React.FC<{
  monster: Monster;
  hideFamilyName?: boolean;
  link?: boolean;
}> = ({ monster, hideFamilyName = false, link = true }) => (
  <CardHeader className="has-data-[slot=card-action]:grid-cols-[2fr_1fr] gap-0">
    <CardTitle className="font-slab font-black small-caps italic text-2xl">
      {link ? (
        <Link href={`/m/${monster.id}`}>{monster.name}</Link>
      ) : (
        monster.name
      )}
    </CardTitle>
    <CardDescription className="col-span-2 flex gap-2 font-condensed small-caps">
      <p>
        Lvl <Level level={monster.level} /> {formatSizeKind(monster)} Minion
      </p>
      {monster.family && !hideFamilyName && (
        <Link
          href={`/families/${monster.family.id}`}
          className="flex items-center"
        >
          <Users className="w-4 pb-1 mr-0.5 text-flame" />
          <strong>{monster.family.name}</strong>
        </Link>
      )}
    </CardDescription>
    <CardAction>
      <StatsGroup monster={monster}>
        <div className="flex grow flex-wrap items-center justify-end font-slab font-black italic">
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
        </div>
      </StatsGroup>
    </CardAction>
  </CardHeader>
);

const HeaderStandard: React.FC<{
  monster: Monster;
  hideFamilyName?: boolean;
  link?: boolean;
}> = ({ monster, hideFamilyName = false, link = true }) => (
  <CardHeader className="has-data-[slot=card-action]:grid-cols-[1fr_1fr] gap-0">
    <CardTitle className="font-slab font-black small-caps italic text-2xl">
      {link ? (
        <Link href={`/m/${monster.id}`}>{monster.name}</Link>
      ) : (
        monster.name
      )}
    </CardTitle>
    <CardDescription className="col-span-2 flex gap-2 font-condensed small-caps">
      <p>
        Lvl <Level level={monster.level} /> {formatSizeKind(monster)}
      </p>
      {monster.family && !hideFamilyName && (
        <Link
          href={`/families/${monster.family.id}`}
          className="flex items-center"
        >
          <Users className="w-4 pb-1 mr-0.5 text-flame" />
          <strong>{monster.family.name}</strong>
        </Link>
      )}
    </CardDescription>
    <CardAction>
      <StatsGroup monster={monster}>
        <div className="flex grow flex-wrap items-center justify-end font-slab font-black italic">
          {monster.armor === "medium" && <ArmorStat value="M" />}
          {monster.armor === "heavy" && <ArmorStat value="H" />}
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
          <HPStat value={monster.hp} />
        </div>
      </StatsGroup>
    </CardAction>
  </CardHeader>
);

interface CardProps {
  monster: Monster;
  creator?: User;
  link?: boolean;
  hideActions?: boolean;
  hideFamilyAbilities?: boolean;
  hideCreator?: boolean;
  hideFamilyName?: boolean;
  className?: string;
}

export const Card = ({
  monster,
  creator,
  link = true,
  hideActions = false,
  hideFamilyAbilities = false,
  hideCreator = false,
  hideFamilyName = false,
  className,
}: CardProps) => {
  const { allConditions: conditions } = useConditions({
    creatorId: creator?.discordId,
  });
  return (
    <div
      className={cn(
        "w-full max-w-sm mx-auto",
        monster.legendary && "max-w-3xl md:col-span-2"
      )}
    >
      <div id={`monster-${monster.id}`}>
        <CardContainer className={className}>
          {monster.legendary ? (
            <HeaderLegendary monster={monster} link={link} />
          ) : monster.minion ? (
            <HeaderMinion
              monster={monster}
              hideFamilyName={hideFamilyName}
              link={link}
            />
          ) : (
            <HeaderStandard
              monster={monster}
              hideFamilyName={hideFamilyName}
              link={link}
            />
          )}

          <CardContentWithGap>
            {((!hideFamilyAbilities && monster.family?.abilities) ||
              monster.abilities.length > 0) && (
              <AbilityOverlay
                conditions={conditions}
                abilities={[
                  ...(hideFamilyAbilities
                    ? []
                    : monster.family?.abilities || []),
                  ...monster.abilities,
                ]}
                family={hideFamilyAbilities ? undefined : monster.family}
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
                    prefix={
                      <strong className="font-condensed">BLOODIED:</strong>
                    }
                  />
                )}

                {monster.lastStand && (
                  <div>
                    <PrefixedFormattedText
                      content={monster.lastStand}
                      conditions={conditions}
                      prefix={
                        <strong className="font-condensed">LAST STAND:</strong>
                      }
                    />
                  </div>
                )}
              </>
            )}

            <MoreInfoSection
              moreInfo={monster.moreInfo}
              conditions={conditions}
            />
          </CardContentWithGap>

          <CardFooterLayout
            creator={creator}
            hideCreator={hideCreator}
            hideActions={hideActions}
            actionsSlot={<CardActions monster={monster} />}
          />
        </CardContainer>
      </div>
    </div>
  );
};
