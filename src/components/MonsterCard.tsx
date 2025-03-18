import { AbilityOverlay } from "@/components/AbilityOverlay";
import {
  ArmorIcon,
  FlyIcon,
  HPIcon,
  SpeedIcon,
  SwimIcon,
} from "@/components/Icons";
import { fetchApi } from "@/lib/api";
import type { Monster } from "@/lib/types";

import {
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import domtoimage from "dom-to-image";
import { Link } from "react-router-dom";

const Stat: React.FC<{
  name: string;
  value: string | number;
  SvgIcon: React.FC<{ className?: string }>;
  children?: React.ReactNode;
}> = ({ name, value, children, SvgIcon }) => {
  if (!value && !children) return null;
  return (
    <span id={name} className="flex ml-2 text-lg leading-6 ">
      <SvgIcon className="w-7 -mr-2 fill-base-300" />
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
      <div className="flex font-beaufort font-black italic">
        {monster.armor === "medium" && (
          <Stat name="armor" value="M" SvgIcon={ArmorIcon} />
        )}
        {monster.armor === "heavy" && (
          <Stat name="armor" value="H" SvgIcon={ArmorIcon} />
        )}
        <Stat name="hp" value={monster.hp} SvgIcon={HPIcon} />
        <Stat name="saves" value="" SvgIcon={StarIcon}>
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
    </header>
    <div className="mb-1">
      <span className="font-slab font-black text-4xl pr-1">{monster.name}</span>
    </div>
  </>
);

const HeaderStandard: React.FC<{ monster: Monster }> = ({ monster }) => (
  <header className="flex justify-between">
    <div className="grow">
      <div className="inline-flex flex-wrap gap-x-1 items-baseline">
        <span className="font-slab font-black font-small-caps italic text-2xl pr-1">
          {monster.name}
        </span>
        <span className="font-condensed font-small-caps whitespace-nowrap items-baseline">
          {`Lvl ${monster.level}${monster.size !== "medium" ? `, ${monster.size}` : ""}`}
        </span>
      </div>
    </div>
    <div className="flex font-slab font-black italic">
      {monster.armor === "medium" && (
        <Stat name="armor" value="M" SvgIcon={ArmorIcon} />
      )}
      {monster.armor === "heavy" && (
        <Stat name="armor" value="H" SvgIcon={ArmorIcon} />
      )}
      <Stat name="swim" value={monster.swim} SvgIcon={SwimIcon} />
      <Stat name="fly" value={monster.fly} SvgIcon={FlyIcon} />
      {monster.speed > 0 && monster.speed !== 6 && (
        <Stat name="speed" value={monster.speed} SvgIcon={SpeedIcon} />
      )}
      <Stat name="hp" value={monster.hp} SvgIcon={HPIcon} />
    </div>
  </header>
);

interface MonsterCardProps {
  monster: Monster;
  showActions?: boolean;
}

const MonsterCard: React.FC<MonsterCardProps> = ({ monster, showActions }) => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationKey: ["deleteMonster", monster.id],
    mutationFn: () =>
      fetchApi(`/api/monsters/${monster.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monsters"] });
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return (
    <div className="mb-5">
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

          {monster.legendary && (
            <div>
              <strong>ACTIONS:</strong> After each hero's turn, choose one:
            </div>
          )}
          <ul className={monster.legendary ? "list-disc ml-4" : ""}>
            {monster.actions?.map((action, index) => (
              <li key={index} className="mb-1 leading-5">
                <strong className="pr-1">{action.name}.</strong>
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
          {monster.legendary && (
            <>
              <hr className="border-black my-2" />
              {monster.bloodied && (
                <p className="bloodied">
                  <strong>BLOODIED: </strong>
                  {monster.bloodied}
                </p>
              )}

              {monster.lastStand && (
                <p className="last-stand">
                  <strong>LAST STAND: </strong>
                  {monster.lastStand}
                </p>
              )}
            </>
          )}

          {monster.contributor && (
            <p className="attribution">
              Contributed by <strong>{monster.contributor}</strong>
            </p>
          )}
        </article>
      </div>

      <div className="flex flex-row justify-end mr-6">
        {/* FIXME
        <button onClick={downloadCard} className="px-2 cursor-pointer">
          <ArrowDownTrayIcon className="h-5 text-slate-500" />
        </button>
        */}
        {showActions && (
          <>
            <Link to={`/my/monsters/${monster.id}/edit`} className="px-2">
              <PencilIcon className="h-5 text-slate-500" />
            </Link>
            <button
              onClick={() => {
                if (window.confirm("Really? This is permanent.")) {
                  deleteMutation.mutate();
                }
              }}
              className="px-2"
            >
              <TrashIcon className="h-5 text-slate-500" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MonsterCard;
