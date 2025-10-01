import clsx from "clsx";
import { useEffect, useRef } from "react";
import { GameIcon } from "@/components/GameIcon";
import type { Item, ItemMini } from "@/lib/services/items";

type ListProps = {
  items: (Item | ItemMini)[];
  selectedIds: string[];
  handleItemClick: (id: string) => void;
  showChecks?: boolean;
  scrollToSelected?: boolean;
};

export const List = ({
  items,
  selectedIds,
  handleItemClick,
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
        {items.map((item) => (
          <li
            key={item.id}
            ref={selectedIds.includes(item.id) ? selectedItemRef : null}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(item.id) && "bg-accent"
            )}
            onClick={() => !showChecks && handleItemClick(item.id)}
            onKeyUp={(k) =>
              k.key === "Enter" && !showChecks && handleItemClick(item.id)
            }
          >
            <div className="flex items-center gap-x-3">
              {showChecks && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleItemClick(item.id)}
                  />
                </label>
              )}
              <div className="grow">
                <div className="relative items-center">
                  {item.imageIcon && (
                    <GameIcon
                      iconId={item.imageIcon}
                      className="absolute top-0 left-0 size-8 fill-icon/50 z-1"
                    />
                  )}
                  <div className="flex flex-col ml-6">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-sm italic text-muted-foreground">
                      {item.kind}
                      {item.rarity !== "unspecified" && (
                        <span className="font-medium">
                          (
                          {item.rarity.charAt(0).toUpperCase() +
                            item.rarity.slice(1).replace("_", " ")}
                          )
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
