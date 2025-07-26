import type React from "react";
import { AbilityOverlay } from "@/ui/AbilityOverlay";
import { maybePeriod } from "@/lib/text";
import type { Monster, User } from "@/lib/types";
import { ChevronsRight, Heart, Shield, Waves, Send, Star } from "lucide-react";
import clsx from "clsx";
import { Attribution } from "@/ui/Attribution";
import CardActions from "./CardActions";
import { Stat } from "./Stat";
import Image from "next/image";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";

const StatsGroup: React.FC<{
  monster: Monster;
  children: React.ReactNode;
}> = ({ monster, children }) => {
  const tooltipLines: string[] = [];

  if (monster.armor)
    tooltipLines.push(
      `Armor: ${monster.armor.charAt(0).toUpperCase() + monster.armor.slice(1)}`,
    );
  if (monster.fly) tooltipLines.push(`Fly: ${monster.fly}`);
  if (monster.swim) tooltipLines.push(`Swim: ${monster.swim}`);
  if (monster.speed) tooltipLines.push(`Speed: ${monster.speed}`);
  if (monster.hp) tooltipLines.push(`HP: ${monster.hp}`);
  if (monster.saves) tooltipLines.push(`Saves: ${monster.saves}`);

  return (
    <div className="relative group">
      <div className="flex items-center">
        {children}
      </div>
      {tooltipLines.length > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
          {tooltipLines.map((line, index) => (
            <p key={line} className={index > 0 ? "mt-1" : ""}>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

const HeaderLegendary: React.FC<{ monster: Monster }> = ({ monster }) => (
  <>
    <header className="flex justify-between items-center -mb-1">
      <div>
        <span className="font-beaufort font-black text-lg leading-none tracking-tight">
          Level {monster.level} Solo{" "}
          {monster.size.charAt(0).toUpperCase() + monster.size.slice(1)}{" "}
          {monster.kind}
        </span>
      </div>
      <StatsGroup monster={monster}>
        <div className="flex items-center justify-center font-slab font-black italic">
          {monster.armor === "medium" && (
            <Stat name="armor" value="M" SvgIcon={Shield} />
          )}
          {monster.armor === "heavy" && (
            <Stat name="armor" value="H" SvgIcon={Shield} />
          )}
          <Stat name="hp" value={monster.hp} SvgIcon={Heart} />
          <Stat name="saves" value="" SvgIcon={Star}>
            <div className="flex flex-col">
              {monster.saves?.split(",").map((save, i, arr) => (
                <span key={save} className="block">
                  {save}
                  {i < arr.length - 1 && ", "}
                </span>
              ))}{" "}
            </div>
          </Stat>
        </div>
      </StatsGroup>
    </header>
    <div className="mb-1">
      <span className="font-slab font-black text-4xl pr-1">{monster.name}</span>
    </div>
  </>
);

const HeaderStandard: React.FC<{ monster: Monster }> = ({ monster }) => (
  <header className="justify-between">
    <div className="flex flex-col gap-x-1 items-start">
      <div className="flex items-center grow w-full justify-between font-slab font-black italic pr-1">
        <div className="font-small-caps text-2xl">{monster.name}</div>
        <StatsGroup monster={monster}>
          <div className="flex grow flex-wrap items-center justify-end">
            {monster.armor === "medium" && (
              <Stat name="armor" value="M" SvgIcon={Shield} />
            )}
            {monster.armor === "heavy" && (
              <Stat name="armor" value="H" SvgIcon={Shield} />
            )}
            <Stat name="swim" value={monster.swim} SvgIcon={Waves} />
            <Stat name="fly" value={monster.fly} SvgIcon={Send} />
            {monster.speed !== 6 && (
              <Stat
                name="speed"
                value={monster.speed}
                SvgIcon={ChevronsRight}
              />
            )}
            <Stat name="hp" value={monster.hp} SvgIcon={Heart} />
          </div>
        </StatsGroup>
      </div>
      <div className="font-condensed font-small-caps whitespace-nowrap items-start">
        Lvl {monster.level}
        {monster.kind && monster.size !== "medium"
          ? ` ${monster.size} ${monster.kind.toLocaleLowerCase()}`
          : monster.kind
            ? ` ${monster.kind.toLocaleLowerCase()}`
            : `, ${monster.size}`}
      </div>
    </div>
  </header>
);

interface ShadcnCardProps {
  monster: Monster;
  creator?: User;
  isOwner?: boolean;
  hideActions?: boolean;
}

export const ShadcnCard = ({
  monster,
  creator,
  isOwner = false,
  hideActions = false,
}: ShadcnCardProps) => {
  return (
    <div className={clsx(monster.legendary && "md:col-span-2")}>
      <div id={`monster-${monster.id}`}>
        <Card className="px-4 py-3">
          <div className="flex gap-4">
            {monster.imageUrl && (
              <div className="flex-shrink-0 w-16 h-16">
                {monster.imageUrl.startsWith('/api/images/') ? (
                  <img
                    src={monster.imageUrl}
                    alt={monster.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="relative w-16 h-16">
                    <Image
                      src={monster.imageUrl}
                      alt={monster.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}
              </div>
            )}
            <div className="flex-1">
              {monster.legendary ? (
                <HeaderLegendary monster={monster} />
              ) : (
                <HeaderStandard monster={monster} />
              )}
            </div>
          </div>

          <CardContent className="px-0">
            <div className="abilities flex flex-col py-2 gap-4">
              {monster.family?.abilities && (
                <AbilityOverlay
                  abilities={monster.family.abilities}
                  family={monster.family}
                />
              )}
              {monster.abilities.map((ability) => (
                <AbilityOverlay key={ability.name} abilities={[ability]} />
              ))}
            </div>

            {monster.actions.length > 0 && (
              <>
                <div>
                  <strong>ACTIONS: </strong>
                  {monster.actionPreface}
                </div>
                <ul className="list-disc pl-4 text-base">
                  {monster.actions?.map((action) => (
                    <li key={action.name} className="py-1">
                      <strong className="pr-1">{maybePeriod(action.name)}</strong>
                      {action.damage && (
                        <span className="damage">{action.damage} </span>
                      )}
                      {action.description && (
                        <span className="description">{action.description}</span>
                      )}
                      {action.range && (
                        <span className="range">({action.range} ft)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
            
            {monster.legendary && (
              <>
                <Separator className="my-4" />
                {monster.bloodied && (
                  <p className="font-condensed">
                    <strong>BLOODIED: </strong>
                    {monster.bloodied}
                  </p>
                )}

                {monster.lastStand && (
                  <p className="font-condensed">
                    <strong>LAST STAND: </strong>
                    {monster.lastStand}
                  </p>
                )}
              </>
            )}

            {monster.moreInfo && (
              <p className="italic mt-4">{monster.moreInfo}</p>
            )}

            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              {creator ? (
                <Attribution user={creator} />
              ) : (
                <div />
              )}

              {!hideActions && (
                <CardActions monster={monster} isOwner={isOwner} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};