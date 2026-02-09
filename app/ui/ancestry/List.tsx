import clsx from "clsx";
import type { AncestryMini } from "@/lib/services/ancestries/types";

type ListProps = {
  ancestries: AncestryMini[];
  selectedIds: string[];
  handleAncestryClick: (id: string) => void;
  showChecks?: boolean;
};

export const List = ({
  ancestries,
  selectedIds,
  handleAncestryClick,
  showChecks,
}: ListProps) => {
  return (
    <div className="list overflow-y-auto max-h-[70vh]">
      <ul className="divide-y divide-base-300">
        {ancestries.map((ancestry) => (
          <li
            key={ancestry.id}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(ancestry.id) && "bg-accent"
            )}
            onClick={() => !showChecks && handleAncestryClick(ancestry.id)}
            onKeyUp={(k) =>
              k.key === "Enter" &&
              !showChecks &&
              handleAncestryClick(ancestry.id)
            }
          >
            <div className="flex items-center gap-x-3">
              {showChecks && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(ancestry.id)}
                    onChange={() => handleAncestryClick(ancestry.id)}
                  />
                </label>
              )}
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">{ancestry.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {ancestry.size.join(", ")}
                  {ancestry.rarity !== "common" && ` • ${ancestry.rarity}`}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
