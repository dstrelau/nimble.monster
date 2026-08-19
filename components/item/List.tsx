import { useEffect, useRef } from "react";
import { GameIcon } from "@/components/icons/GameIcon";
import { Checkbox } from "@/components/ui/checkbox";
import type { Item, ItemMini } from "@/lib/services/items";
import { cn } from "@/lib/utils";

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
  showChecks = false,
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
            className={cn(
              "block p-3 transition-colors",
              !showChecks &&
                "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              selectedIds.includes(item.id) && "bg-accent"
            )}
            onClick={showChecks ? undefined : () => handleItemClick(item.id)}
            onKeyDown={
              showChecks
                ? undefined
                : (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleItemClick(item.id);
                    }
                  }
            }
            role={showChecks ? undefined : "button"}
            tabIndex={showChecks ? undefined : 0}
          >
            <div className="flex items-center gap-3">
              {showChecks && (
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => handleItemClick(item.id)}
                  aria-label={`Select ${item.name}`}
                />
              )}
              <div className="flex size-8 shrink-0 items-center justify-center">
                {item.imageIcon && (
                  <GameIcon
                    iconId={item.imageIcon}
                    className="size-8 fill-icon/50"
                  />
                )}
              </div>
              <div className="min-w-0 grow">
                <h3 className="break-words font-bold text-lg">{item.name}</h3>
                <p className="text-muted-foreground text-sm italic">
                  {item.kind}
                  {item.kind && item.rarity !== "unspecified" && " "}
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
          </li>
        ))}
      </ul>
    </div>
  );
};
