import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchApi } from "../lib/api";
import { Monster } from "../lib/types";
import { ArmorIcon, FlyIcon, HPIcon, SpeedIcon, SwimIcon } from "./Icons";

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

  return (
    <div>
      <article className="font-roboto px-4 py-2 bg-[#f5ebd7] scooped">
        <header className="flex justify-between leading-5">
          <div className="grow">
            <span className="font-serif font-black font-small-caps italic text-2xl pr-1">
              {monster.name}
            </span>
            <span className="font-small-caps">
              {`Lvl ${monster.level}${monster.size !== "medium" ? `, ${monster.size}` : ""}`}
            </span>
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

        {monster.abilities?.map((ability, index) => (
          <p
            key={index}
            className="relative italic mb-2 p-2 leading-5 bg-[#d3cebb]"
            style={{
              clipPath:
                "polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)",
              marginRight: "-30px",
              paddingRight: "30px",
              marginLeft: "-30px",
              paddingLeft: "30px",
            }}
          >
            <strong className="pr-1">{maybePeriod(ability.name)}</strong>
            {ability.description}
          </p>
        ))}

        {monster.actions?.map((action, index) => (
          <p key={index} className="mb-1 leading-5">
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
            {action.range && <span className="range">({action.range} ft)</span>}
          </p>
        ))}

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

        {monster.contributor && (
          <p className="attribution">
            Contributed by <strong>{monster.contributor}</strong>
          </p>
        )}
      </article>

      {showActions && (
        <div className="flex flex-row justify-end mr-4">
          <Link to={`/my/monsters/${monster.id}/edit`} className="w-4 mx-4 p-2">
            <PencilIcon className="w-5 h-5 text-slate-500" />
          </Link>
          <button
            onClick={() => {
              if (window.confirm("Really? This is permanent.")) {
                deleteMutation.mutate();
              }
            }}
            className="w-4 p-2"
          >
            <TrashIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MonsterCard;
