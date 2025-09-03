import clsx from "clsx";
import { useEffect, useRef } from "react";
import { GameIcon } from "@/components/GameIcon";
import type { Item } from "@/lib/types";

type ListProps = {
  items: Item[];
  selectedIds: string[];
  handleItemClick: (id: string) => void;
  scrollToSelected?: boolean;
};

export const List = ({
  items,
  selectedIds,
  handleItemClick,
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
        {items.map((item) => (
          <li
            key={item.id}
            ref={selectedIds.includes(item.id) ? selectedItemRef : null}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(item.id) && "bg-accent"
            )}
            onClick={() => handleItemClick(item.id)}
            onKeyUp={(k) => k.key === "Enter" && handleItemClick(item.id)}
          >
            <div className="flex items-center -gap-x-12">
              {item.imageIcon && (
                <GameIcon
                  iconId={item.imageIcon}
                  className="w-8 h-8 fill-icon/50 z-0"
                />
              )}
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm italic text-muted-foreground">
                  {item.kind}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
