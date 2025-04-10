"use client";

import React, { useState } from "react";
import { AbilityOverlay } from "./AbilityOverlay";
import { fetchApi } from "@/lib/api";
import { maybePeriod } from "@/lib/text";
import type { Monster, User } from "@/lib/types";
import {
  Footprints,
  Heart,
  Shield,
  Waves,
  Send,
  Star,
  Pencil,
  Trash,
  Download,
  Frown,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { Attribution } from "@/ui/Attribution";

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
  creator?: User;
  showActions?: boolean;
}

export const MonsterCard: React.FC<MonsterCardProps> = ({
  monster,
  creator,
  showActions,
}) => {
  const [downloadError, setDownloadError] = useState(false);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationKey: ["deleteMonster", monster.id],
    mutationFn: () =>
      fetchApi(`/api/monsters/${monster.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monsters"] });
    },
  });

  // Helper function to test error state
  const downloadCard = async () => {
    try {
      const cardElement = document.querySelector(
        `#monster-${monster.id} article`,
      );
      if (!cardElement) return;

      // Store original style
      const exportAttribution = cardElement.querySelector(
        ".export-attribution",
      );
      let originalAttributionDisplay = "";

      if (exportAttribution) {
        originalAttributionDisplay = (exportAttribution as HTMLElement).style
          .display;
        (exportAttribution as HTMLElement).style.display = "block";
      }

      try {
        // Create a wrapper with padding to handle the overflow
        const wrapper = document.createElement("div");
        wrapper.style.position = "absolute";
        wrapper.style.left = "-9999px";
        wrapper.style.top = "0";
        wrapper.style.padding = "1.5rem 1.5rem 0 1.5rem"; // Padding on sides and top only
        document.body.appendChild(wrapper);

        const cardClone = cardElement.cloneNode(true) as HTMLElement;

        // Remove action buttons from clone before capture
        const actionsDiv = cardClone.querySelector(".d-card-actions");
        if (actionsDiv) {
          actionsDiv.parentNode?.removeChild(actionsDiv);
        }

        // Replace dividers with simple HR elements to ensure they show up in the image
        const dividers = cardClone.querySelectorAll(".d-divider");
        dividers.forEach((divider) => {
          const hr = document.createElement("hr");
          hr.style.width = "100%";
          hr.style.margin = "0.25rem 0";
          hr.style.border = "none";
          hr.style.borderTop = "1px solid #e5e7eb";
          hr.style.height = "1px";
          divider.parentNode?.replaceChild(hr, divider);
        });

        // Fix vertical spacing in card
        const abilities = cardClone.querySelectorAll(".abilities");
        abilities.forEach((a) => {
          (a as HTMLElement).style.gap = "0.5rem";
        });
        const ps = cardClone.querySelectorAll("p");
        ps.forEach((p) => {
          (p as HTMLElement).style.margin = "0.25rem 0";
        });

        cardClone.style.paddingBottom = "0.75rem";

        wrapper.appendChild(cardClone);

        const originalCard = document.querySelector(
          `#monster-${monster.id} article`,
        ) as HTMLElement;
        const originalWidth = originalCard.offsetWidth;
        cardClone.style.width = `${originalWidth}px`;

        const canvas = await html2canvas(wrapper, {
          scale: 2,
          backgroundColor: null, // Transparent background
          useCORS: true,
          allowTaint: true,
          imageTimeout: 0,
          logging: true,
        });

        document.body.removeChild(wrapper);

        const link = document.createElement("a");
        link.download = `${monster.name}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } finally {
        if (exportAttribution) {
          (exportAttribution as HTMLElement).style.display =
            originalAttributionDisplay;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setDownloadError(true);
      setTimeout(() => {
        setDownloadError(false);
      }, 5000);
    }
  };

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

            <div className="d-card-actions">
              {showActions && monster.visibility === "public" && (
                <div className="d-badge d-badge-soft d-badge-success mr-2">
                  Public
                </div>
              )}
              <button onClick={downloadCard} className="px-2 cursor-pointer">
                {downloadError ? (
                  <Frown className="w-5 h-5 text-error" />
                ) : (
                  <Download className="w-5 h-5 text-base-content/50" />
                )}
              </button>
              {showActions && (
                <>
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
                </>
              )}
            </div>
          </div>
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
        <MonsterCard
          key={m.id}
          monster={m}
          creator={m.creator}
          showActions={showActions}
        />
      ))}
    </div>
  );
};
