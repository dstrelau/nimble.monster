import clsx from "clsx";
import type { SpellSchoolMini } from "@/lib/types";

type ListProps = {
  schools: SpellSchoolMini[];
  selectedIds: string[];
  handleSchoolClick: (id: string) => void;
  showChecks?: boolean;
};

export const List = ({
  schools,
  selectedIds,
  handleSchoolClick,
  showChecks,
}: ListProps) => {
  return (
    <div className="list overflow-y-auto max-h-[70vh]">
      <ul className="divide-y divide-base-300">
        {schools.map((school) => (
          <li
            key={school.id}
            className={clsx(
              "block p-3 transition-colors cursor-pointer",
              selectedIds.includes(school.id) && "bg-accent"
            )}
            onClick={() => !showChecks && handleSchoolClick(school.id)}
            onKeyUp={(k) =>
              k.key === "Enter" && !showChecks && handleSchoolClick(school.id)
            }
          >
            <div className="flex items-center gap-x-3">
              {showChecks && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(school.id)}
                    onChange={() => handleSchoolClick(school.id)}
                  />
                </label>
              )}
              <div className="flex flex-col">
                <h3 className="font-bold text-lg">{school.name}</h3>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
