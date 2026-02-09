import clsx from "clsx";
import type { BackgroundMini } from "@/lib/services/backgrounds/types";

type ListProps = {
  backgrounds: BackgroundMini[];
  selectedIds: string[];
  handleBackgroundClick: (id: string) => void;
  showChecks?: boolean;
};

export const List = ({
  backgrounds,
  selectedIds,
  handleBackgroundClick,
  showChecks,
}: ListProps) => {
  return (
    <div className="list overflow-y-auto max-h-[70vh]">
      <ul className="divide-y divide-base-300">
        {backgrounds.map((background) => (
          <li
            key={background.id}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(background.id) && "bg-accent"
            )}
            onClick={() => !showChecks && handleBackgroundClick(background.id)}
            onKeyUp={(k) =>
              k.key === "Enter" &&
              !showChecks &&
              handleBackgroundClick(background.id)
            }
          >
            <div className="flex items-center gap-x-3">
              {showChecks && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(background.id)}
                    onChange={() => handleBackgroundClick(background.id)}
                  />
                </label>
              )}
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">{background.name}</h3>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
