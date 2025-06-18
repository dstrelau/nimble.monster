"use client";

import { SearchInput } from "@/ui/SearchInput";
import clsx from "clsx";
import { ArrowDownUp, Crown, User } from "lucide-react";

export type LegendaryFilter = "all" | "legendary" | "standard";
export type SortOption =
  | "name-asc"
  | "name-desc"
  | "level-asc"
  | "level-desc"
  | "hp-asc"
  | "hp-desc";

interface SimpleFilterBarProps {
  searchTerm: string;
  legendaryFilter: LegendaryFilter;
  sortOption: SortOption;
  onSearch: (value: string) => void;
  onLegendaryFilterChange: (filter: LegendaryFilter) => void;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A→Z)" },
  { value: "name-desc", label: "Name (Z→A)" },
  { value: "level-asc", label: "Level (Low→High)" },
  { value: "level-desc", label: "Level (High→Low)" },
  { value: "hp-asc", label: "HP (Low→High)" },
  { value: "hp-desc", label: "HP (High→Low)" },
];

export const SimpleFilterBar: React.FC<SimpleFilterBarProps> = ({
  searchTerm,
  legendaryFilter,
  sortOption,
  onSearch,
  onLegendaryFilterChange,
  onSortChange,
}) => {
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortOption)?.label || "Name (A-Z)";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex-1 min-w-2xs">
        <SearchInput
          value={searchTerm}
          onChange={onSearch}
          placeholder="Search"
        />
      </div>

      {/* Filter buttons - will wrap to new line if needed */}
      <div className="d-join">
        <button
          type="button"
          className={`d-btn d-join-item ${legendaryFilter === "all" ? "d-btn-active" : ""}`}
          onClick={() => onLegendaryFilterChange("all")}
        >
          <User className="h-4 w-4" />
          +
          <Crown className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={clsx(
            "d-btn d-join-item",
            legendaryFilter === "standard" && "d-btn-active",
          )}
          onClick={() => onLegendaryFilterChange("standard")}
        >
          <User className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={clsx(
            "d-btn d-join-item",
            legendaryFilter === "legendary" && "d-btn-active",
          )}
          onClick={() => onLegendaryFilterChange("legendary")}
        >
          <Crown className="h-4 w-4" />
        </button>
      </div>

      {/* Sort dropdown */}
      <div className="d-dropdown d-dropdown-end">
        <div tabIndex={0} role="button" className="d-btn d-btn-ghost gap-2">
          <ArrowDownUp className="h-4 w-4" />
          {sortLabel}
        </div>
        <ul
          tabIndex={0}
          className="d-dropdown-content z-[1] d-menu p-2 shadow bg-base-100 rounded-box w-48"
        >
          {SORT_OPTIONS.map((option) => (
            <li key={option.value}>
              <button
                onClick={() => onSortChange(option.value)}
                className={clsx(
                  sortOption === option.value &&
                    "d-active bg-primary text-primary-content",
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
