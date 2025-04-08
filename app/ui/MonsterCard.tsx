"use client";

import { AbilityOverlay } from "./AbilityOverlay";
import { fetchApi } from "@/lib/api";
import { maybePeriod } from "@/lib/text";
import type { Monster } from "@/lib/types";
import {
  Footprints,
  Heart,
  Shield,
  Waves,
  Send,
  Star,
  Pencil,
  Trash,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";

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

interface MonsterCardProps {
  monster: Monster;
  showActions?: boolean;
}

export const MonsterCard: React.FC<MonsterCardProps> = ({
  monster,
  showActions,
}) => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationKey: ["deleteMonster", monster.id],
    mutationFn: () =>
      fetchApi(`/api/monsters/${monster.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monsters"] });
    },
  });

  /*
  const downloadCard = async () => {
    const card = document.getElementById(`monster-${monster.id}`);
    if (!card) return;

    const scale = 2;
    const width = card.offsetWidth * scale;
    const height = card.offsetHeight * scale;

    const dataUrl = await domtoimage.toPng(card, {
      height,
      width,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${monster.name}.png`;
    a.click();
  };
  */

  return (
    <div className={clsx(monster.legendary && "md:col-span-2")}>
      <div id={`monster-${monster.id}`}>
        <article className="d-card d-card-border px-4 py-3 bg-base-100 border-base-300">
          {monster.legendary ? (
            <HeaderLegendary monster={monster} />
          ) : (
            <HeaderStandard monster={monster} />
          )}

          <div className="flex flex-col py-2 gap-4">
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

          {monster.contributor && (
            <p className="attribution">
              Contributed by <strong>{monster.contributor}</strong>
            </p>
          )}

          {showActions && (
            <>
              <div className="d-divider my-1"></div>
              <div className="d-card-actions justify-end">
                {monster.visibility === "public" && (
                  <div className="d-badge d-badge-soft d-badge-success">
                    Public
                  </div>
                )}
                {/* FIXME
                <button onClick={downloadCard} className="px-2 cursor-pointer">
                  <ArrowDownTrayIcon className="h-5 text-slate-500" />
                </button>
                */}
                <Link href={`/my/monsters/${monster.id}/edit`}>
                  <Pencil className="w-5 h-5 text-base-content/50" />
                </Link>
                <button
                  onClick={() => {
                    if (window.confirm("Really? This is permanent.")) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  <Trash className="w-5 h-5 text-base-content/50 cursor-pointer" />
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
};

export const MonsterCardGrid = ({
  monsters,
  showActions,
  gridColumns = { default: 1, md: 2, lg: 3 },
}: {
  monsters: Monster[];
  showActions: boolean;
  gridColumns?: { default?: number; sm?: number; md?: number; lg?: number };
}) => {
  return (
    <div
      className={clsx(
        "grid gap-8",
        gridColumns.default && `grid-cols-${gridColumns.default}`,
        gridColumns.sm && `grid-cols-${gridColumns.sm}`,
        gridColumns.md && `md:grid-cols-${gridColumns.md}`,
        gridColumns.lg && `lg:grid-cols-${gridColumns.lg}`,
      )}
    >
      {monsters.map((m) => (
        <MonsterCard key={m.id} monster={m} showActions={showActions} />
      ))}
    </div>
  );
};
