import clsx from "clsx";
import { useEffect, useRef } from "react";
import type { Companion, CompanionMini } from "@/lib/types";

type ListProps = {
  companions: (Companion | CompanionMini)[];
  selectedIds: string[];
  handleCompanionClick: (id: string) => void;
  showChecks?: boolean;
  scrollToSelected?: boolean;
};

export const List = ({
  companions,
  selectedIds,
  handleCompanionClick,
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
        {companions.map((companion) => (
          <li
            key={companion.id}
            ref={selectedIds.includes(companion.id) ? selectedItemRef : null}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(companion.id) && "bg-accent"
            )}
            onClick={() => !showChecks && handleCompanionClick(companion.id)}
            onKeyUp={(k) =>
              k.key === "Enter" &&
              !showChecks &&
              handleCompanionClick(companion.id)
            }
          >
            <div className="flex items-center gap-x-3">
              {showChecks && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(companion.id)}
                    onChange={() => handleCompanionClick(companion.id)}
                  />
                </label>
              )}
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">{companion.name}</h3>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
