import {
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchApi } from "../lib/api";
import { Monster } from "../lib/types";
import { ArmorIcon, FlyIcon, HPIcon, SpeedIcon, SwimIcon } from "./Icons";
// import html2canvas from "html2canvas";
import domtoimage from "dom-to-image";

const StatString: React.FC<{
  name: string;
  value: string;
  SvgIcon: React.FC<{ className?: string }>;
}> = ({ name, value, SvgIcon }) => {
  if (!value) return null;
  return (
    <span id={name} className="flex ml-2 leading-8">
      <SvgIcon className="fill-[#d3cebb] w-8 -mr-2" />
      {value}
    </span>
  );
};

const StatInt: React.FC<{
  name: string;
  value: number;
  SvgIcon: React.FC<{ className?: string }>;
}> = ({ name, value, SvgIcon }) => {
  if (!value || value <= 0) return null;
  return (
    <span id={name} className="flex ml-2 leading-8">
      <SvgIcon className="fill-[#d3cebb] w-8 -mr-2" />
      {value}
    </span>
  );
};

const maybePeriod = (s: string) => {
  if (s && (s.endsWith(".") || s.endsWith("!") || s.endsWith("?"))) {
    return s;
  }
  return s + ".";
};

const HeaderLegendary: React.FC<{ monster: Monster }> = ({ monster }) => (
  <>
    <header className="flex justify-between items-center -mb-1">
      <div>
        <span className="font-serif font-black text-[#5d5e5b] text-lg leading-none tracking-tight">
          Level {monster.level} Solo{" "}
          {monster.size.charAt(0).toUpperCase() + monster.size.slice(1)}{" "}
          {monster.kind}
        </span>
      </div>
      <div className="flex font-serif font-black italic">
        {monster.armor === "medium" && (
          <StatString name="armor" value="M" SvgIcon={ArmorIcon} />
        )}
        {monster.armor === "heavy" && (
          <StatString name="armor" value="H" SvgIcon={ArmorIcon} />
        )}
        <StatInt name="hp" value={monster.hp} SvgIcon={HPIcon} />
        <div id="saves" className="flex ml-2 leading-none">
          <StarIcon className="fill-[#d3cebb] w-8 -mr-2" />
          <span className="flex flex-col">
            {monster.saves?.split(",").map((save, i, arr) => (
              <span key={i} className="block">
                {save}
                {i < arr.length - 1 && ", "}
              </span>
            ))}{" "}
          </span>
        </div>
      </div>
    </header>
    <div className="mb-1">
      <span className="font-serif font-black text-4xl pr-1">
        {monster.name}
      </span>
    </div>
  </>
);

const HeaderStandard: React.FC<{ monster: Monster }> = ({ monster }) => (
  <header className="flex justify-between leading-5">
    <div className="grow">
      <div className="inline-flex flex-wrap gap-x-1 items-baseline">
        <span className="font-serif font-black font-small-caps italic text-2xl pr-1">
          {monster.name}
        </span>
        <span className="font-small-caps whitespace-nowrap">
          {`Lvl ${monster.level}${monster.size !== "medium" ? `, ${monster.size}` : ""}`}
        </span>
      </div>
    </div>
    <div className="flex font-serif font-black italic">
      {monster.armor === "medium" && (
        <StatString name="armor" value="M" SvgIcon={ArmorIcon} />
      )}
      {monster.armor === "heavy" && (
        <StatString name="armor" value="H" SvgIcon={ArmorIcon} />
      )}
      <StatInt name="swim" value={monster.swim} SvgIcon={SwimIcon} />
      <StatInt name="fly" value={monster.fly} SvgIcon={FlyIcon} />
      {monster.speed > 0 && monster.speed !== 6 && (
        <StatInt name="speed" value={monster.speed} SvgIcon={SpeedIcon} />
      )}
      <StatInt name="hp" value={monster.hp} SvgIcon={HPIcon} />
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
      <div className="px-5 py-2" id={`monster-${monster.id}`}>
        <article className="font-roboto px-4 py-2 bg-[#f5ebd7] scooped">
          {monster.legendary ? (
            <HeaderLegendary monster={monster} />
          ) : (
            <HeaderStandard monster={monster} />
          )}
          {monster.abilities?.map((ability, index) => (
            <p
              key={index}
              className={`relative italic mb-2 p-2 leading-5 bg-[#d3cebb] ${monster.legendary ? " text-center " : ""}`}
              style={{
                clipPath:
                  "polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)",
                transform: "translateX(-30px)",
                width: "calc(100% + 60px)",
                paddingLeft: "30px",
                paddingRight: "30px",
              }}
            >
              <strong className="pr-1">{maybePeriod(ability.name)}</strong>
              {ability.description}
            </p>
          ))}

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
                  <span className="damage">
                    {action.description
                      ? maybePeriod(action.damage)
                      : action.damage}
                  </span>
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
        <button onClick={downloadCard} className="px-2">
          <ArrowDownTrayIcon className="h-5 text-slate-500" />
        </button>
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
