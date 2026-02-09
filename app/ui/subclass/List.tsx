import clsx from "clsx";
import type { SubclassMini } from "@/lib/types";

type ListProps = {
  subclasses: SubclassMini[];
  selectedIds: string[];
  handleSubclassClick: (id: string) => void;
  showChecks?: boolean;
};

export const List = ({
  subclasses,
  selectedIds,
  handleSubclassClick,
  showChecks,
}: ListProps) => {
  return (
    <div className="list overflow-y-auto max-h-[70vh]">
      <ul className="divide-y divide-base-300">
        {subclasses.map((subclass) => (
          <li
            key={subclass.id}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(subclass.id) && "bg-accent"
            )}
            onClick={() => !showChecks && handleSubclassClick(subclass.id)}
            onKeyUp={(k) =>
              k.key === "Enter" &&
              !showChecks &&
              handleSubclassClick(subclass.id)
            }
          >
            <div className="flex items-center gap-x-3">
              {showChecks && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(subclass.id)}
                    onChange={() => handleSubclassClick(subclass.id)}
                  />
                </label>
              )}
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">{subclass.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {subclass.className}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
