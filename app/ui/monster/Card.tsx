import clsx from "clsx";
import { Users } from "lucide-react";
import React from "react";
import { AbilityOverlay } from "@/app/ui/AbilityOverlay";
import { Attribution } from "@/app/ui/Attribution";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { maybePeriod } from "@/lib/text";
import type { Monster, User } from "@/lib/types";
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

  if (tooltipLines.length === 0) {
    return <div className="flex items-center">{children}</div>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center">{children}</div>
      </TooltipTrigger>
      <TooltipContent className="w-fit p-3">
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
          {tooltipLines.map((line) => (
            <React.Fragment key={line}>
              <dt className="text-right font-medium">{line.split(":")[0]}:</dt>
              <dd className="text-left">{line.split(":")[1]}</dd>
            </React.Fragment>
          ))}
        </dl>
      </TooltipContent>
    </Tooltip>
  );
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
      Level {monster.level} Solo{" "}
      {monster.size.charAt(0).toUpperCase() + monster.size.slice(1)}{" "}
      {monster.kind}
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
        Lvl {monster.level}
        {monster.kind && monster.size !== "medium"
          ? ` ${monster.size} ${monster.kind.toLocaleLowerCase()}`
          : monster.kind
            ? ` ${monster.kind.toLocaleLowerCase()}`
            : monster.size !== "medium"
              ? ` ${monster.size}`
              : ""}
      </p>
      {monster.family && !hideFamilyName && (
        <Link href={`/f/${monster.family.id}`} className="flex items-center">
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
  isOwner?: boolean;
  link?: boolean;
  hideActions?: boolean;
  hideFamilyAbilities?: boolean;
  hideCreator?: boolean;
  hideFamilyName?: boolean;
}

export const Card = ({
  monster,
  creator,
  isOwner = false,
  link = true,
  hideActions = false,
  hideFamilyAbilities = false,
  hideCreator = false,
  hideFamilyName = false,
}: CardProps) => {
  return (
    <div className={clsx(monster.legendary && "md:col-span-2")}>
      <div id={`monster-${monster.id}`}>
        <ShadcnCard className="gap-4 py-4">
          {monster.legendary ? (
            <HeaderLegendary monster={monster} link={link} />
          ) : (
            <HeaderStandard
              monster={monster}
              hideFamilyName={hideFamilyName}
              link={link}
            />
          )}

          <CardContent className="flex flex-col gap-4">
            {((!hideFamilyAbilities && monster.family?.abilities) ||
              monster.abilities.length > 0) && (
              <AbilityOverlay
                abilities={[
                  ...(hideFamilyAbilities
                    ? []
                    : monster.family?.abilities || []),
                  ...monster.abilities,
                ]}
                family={hideFamilyAbilities ? undefined : monster.family}
              />
            )}

            {monster.actions.length > 0 && (
              <div>
                <div>
                  <strong className="font-condensed">ACTIONS: </strong>
                  {monster.actionPreface}
                </div>
                <ul className="text-base list-disc pl-4">
                  {monster.actions?.map((action) => (
                    <li key={action.name}>
                      <strong className="pr-1">
                        {maybePeriod(action.name)}
                      </strong>
                      {action.damage && (
                        <span className="damage">{action.damage} </span>
                      )}
                      {action.description && (
                        <span className="description">
                          {action.description}
                        </span>
                      )}
                      {action.range && (
                        <span className="range">({action.range} ft)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {monster.legendary && (
              <div>
                {monster.bloodied && (
                  <p>
                    <strong className="font-condensed">BLOODIED: </strong>
                    {monster.bloodied}
                  </p>
                )}

                {monster.lastStand && (
                  <p>
                    <strong className="font-condensed">LAST STAND: </strong>
                    {monster.lastStand}
                  </p>
                )}
              </div>
            )}

            {monster.moreInfo && <p className="italic">{monster.moreInfo}</p>}
          </CardContent>

          {(!hideActions || !hideCreator) && (
            <>
              <Separator />
              <CardFooter className="flex-col items-stretch">
                <div className="flex items-center justify-between">
                  {creator && !hideCreator ? (
                    <Attribution user={creator} />
                  ) : (
                    <div /> /* Empty div to maintain flex layout */
                  )}

                  {!hideActions && (
                    <CardActions monster={monster} isOwner={isOwner} />
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
