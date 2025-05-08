import { Monster } from "@/lib/types";
import clsx from "clsx";
import { Crown, Heart, Shield } from "lucide-react";
import { Stat } from "./Stat";

type ListProps = {
  monsters: Monster[];
  selectedIds: string[];
  handleMonsterClick: (id: string) => void;
  showChecks?: boolean;
};

export const List = ({
  monsters,
  selectedIds,
  handleMonsterClick,
  showChecks,
}: ListProps) => (
  <div className="list overflow-y-auto max-h-[70vh]">
    <ul className="divide-y divide-base-300">
      {monsters.map((monster) => (
        <li
          key={monster.id}
          className={clsx(
            "block p-3 transition-colors cursor-pointer",
            selectedIds.includes(monster.id) && "bg-primary/10",
          )}
          onClick={() => !showChecks && handleMonsterClick(monster.id)}
        >
          <div className="flex items-center gap-x-3">
            {showChecks && (
              <label>
                <input
                  type="checkbox"
                  className="d-checkbox"
                  checked={selectedIds.includes(monster.id)}
                  onChange={() => handleMonsterClick(monster.id)}
                />
              </label>
            )}
            <div className="grow">
              <h3 className="font-bold text-lg">
                {monster.legendary && (
                  <Crown size={14} className="inline align-baseline mr-1" />
                )}
                {monster.name}
              </h3>
              <p className="text-sm text-base-content/70">
                Level {monster.level}
                {monster.legendary ? " Solo " : ", "}
                {monster.size.charAt(0).toUpperCase() +
                  monster.size.slice(1)}{" "}
                {monster.kind}
              </p>
            </div>
            <div className="flex items-center">
              <div className="flex items-center mr-2 font-slab font-black italic">
                {monster.armor === "medium" && (
                  <Stat name="armor" value="M" SvgIcon={Shield} />
                )}
                {monster.armor === "heavy" && (
                  <Stat name="armor" value="H" SvgIcon={Shield} />
                )}
                <Stat name="hp" value={monster.hp} SvgIcon={Heart} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);
