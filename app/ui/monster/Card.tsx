import React from "react";
import { AbilityOverlay } from "@/ui/AbilityOverlay";
import { maybePeriod } from "@/lib/text";
import type { Monster, User } from "@/lib/types";
import { Footprints, Heart, Shield, Waves, Send, Star } from "lucide-react";
import clsx from "clsx";
import { Attribution } from "@/ui/Attribution";
import CardActions from "./CardActions";

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
    <div className="d-dropdown d-dropdown-hover d-dropdown-bottom d-dropdown-center ">
      <div tabIndex={0} className="flex items-center">
        {children}
      </div>
      {tooltipLines.length > 0 && (
        <div className="d-dropdown-content d-shadow rounded-md bg-neutral text-neutral-content font-sans not-italic z-10">
          <div className="p-2 text-sm gap-0 min-w-32">
            {tooltipLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{
  name: string;
  value: string | number;
  SvgIcon: React.FC<{ className?: string }>;
  children?: React.ReactNode;
}> = ({ name, value, children, SvgIcon }) => {
  if (!value && !children) return null;
  return (
    <span
      id={name}
      className="flex items-center ml-2 text-lg text-content leading-6 py-1"
    >
      <SvgIcon className="w-7 -mr-[6px] stroke-base-300 fill-base-300" />
      {value}
      {children}
    </span>
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
                <span key={i} className="block">
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
          <div className="flex items-center">
            {monster.armor === "medium" && (
              <Stat name="armor" value="M" SvgIcon={Shield} />
            )}
            {monster.armor === "heavy" && (
              <Stat name="armor" value="H" SvgIcon={Shield} />
            )}
            <Stat name="swim" value={monster.swim} SvgIcon={Waves} />
            <Stat name="fly" value={monster.fly} SvgIcon={Send} />
            {monster.speed > 0 && (
              <Stat name="speed" value={monster.speed} SvgIcon={Footprints} />
            )}
            <Stat name="hp" value={monster.hp} SvgIcon={Heart} />
          </div>
        </StatsGroup>
      </div>
      <div className="font-condensed font-small-caps whitespace-nowrap items-start">
        {`Lvl ${monster.level}${monster.size !== "medium" ? `, ${monster.size}` : ""}`}
      </div>
    </div>
  </header>
);

interface CardProps {
  monster: Monster;
  creator?: User;
  showActions?: boolean;
}

export const Card = ({ monster, creator, showActions }: CardProps) => {
  return (
    <div className={clsx(monster.legendary && "md:col-span-2")}>
      <div id={`monster-${monster.id}`}>
        <article className="d-card d-card-border px-4 py-3 bg-base-100 border-base-300">
          {monster.legendary ? (
            <HeaderLegendary monster={monster} />
          ) : (
            <HeaderStandard monster={monster} />
          )}

          <div className="abilities flex flex-col py-2 gap-4">
            {monster.family?.abilities.map((ability, index) => (
              <AbilityOverlay
                key={index}
                ability={ability}
                family={monster.family}
              />
            ))}
            {monster.abilities.map((ability, index) => (
              <AbilityOverlay key={index} ability={ability} />
            ))}
          </div>

          {monster.actions.length > 0 && (
            <>
              <div>
                <strong>ACTIONS: </strong>
                {monster.actionPreface}
              </div>
              <ul className="d-list text-base list-disc pl-4">
                {monster.actions?.map((action, index) => (
                  <li key={index} className="d-list-item">
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
              <div className="d-divider my-1"></div>
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
            <>
              <p className="italic mt-4">{monster.moreInfo}</p>
            </>
          )}

          <div className="d-divider my-1"></div>
          <div className="flex items-center justify-between">
            {creator ? (
              <Attribution user={creator} />
            ) : (
              <div></div> /* Empty div to maintain flex layout */
            )}

            <CardActions monster={monster} showActions={showActions} />
          </div>
        </article>
      </div>
    </div>
  );
};
