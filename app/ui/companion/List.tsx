import clsx from "clsx";
import { useEffect, useRef } from "react";
import type { Companion } from "@/lib/types";

type ListProps = {
  companions: Companion[];
  selectedIds: string[];
  handleCompanionClick: (id: string) => void;
  scrollToSelected?: boolean;
};

export const List = ({
  companions,
  selectedIds,
  handleCompanionClick,
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
            onClick={() => handleCompanionClick(companion.id)}
            onKeyUp={(k) =>
              k.key === "Enter" && handleCompanionClick(companion.id)
            }
          >
            <div className="flex flex-col">
              <h3 className="font-bold text-lg">{companion.name}</h3>
              <p className="text-sm text-muted-foreground">
                {companion.kind} • {companion.class}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
