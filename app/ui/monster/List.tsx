import clsx from "clsx";
import { Crown, PersonStanding } from "lucide-react";
import { useEffect, useRef } from "react";
import { Level } from "@/components/Level";
import type { MonsterMini } from "@/lib/types";
import { ArmorStat, HPStat } from "./Stat";

type ListProps = {
  monsters: MonsterMini[];
  selectedIds: string[];
  handleMonsterClick: (id: string) => void;
  showChecks?: boolean;
  scrollToSelected?: boolean;
};

export const List = ({
  monsters,
  selectedIds,
  handleMonsterClick,
  showChecks,
  scrollToSelected = false,
}: ListProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (
      scrollToSelected &&
      selectedIds.length > 0 &&
      selectedItemRef.current &&
      listRef.current
    ) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [scrollToSelected, selectedIds]);

  return (
    <div ref={listRef} className="list overflow-y-auto max-h-[70vh]">
      <ul className="divide-y divide-base-300">
        {monsters.map((monster) => (
          <li
            key={monster.id}
            ref={selectedIds.includes(monster.id) ? selectedItemRef : null}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(monster.id) && "bg-accent"
            )}
            onClick={() => !showChecks && handleMonsterClick(monster.id)}
            onKeyUp={(k) =>
              k.key === "Enter" && !showChecks && handleMonsterClick(monster.id)
            }
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
                    <Crown
                      size={14}
                      className="inline align-baseline mr-1 stroke-flame"
                    />
                  )}
                  {monster.minion && (
                    <PersonStanding
                      size={14}
                      className="inline align-baseline mr-1 stroke-flame"
                    />
                  )}
                  {monster.name}
                </h3>
                <p className="text-sm text-base-content/70">
                  Level <Level level={monster.level} />
                  {monster.legendary ? " Solo " : ", "}
                  {monster.size.charAt(0).toUpperCase() + monster.size.slice(1)}{" "}
                  {monster.kind}
                </p>
              </div>
              <div className="flex items-center">
                <div className="flex items-center mr-2 font-slab font-black italic">
                  {monster.armor === "medium" && <ArmorStat value="M" />}
                  {monster.armor === "heavy" && <ArmorStat value="H" />}
                  {monster.minion || <HPStat value={monster.hp} />}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
