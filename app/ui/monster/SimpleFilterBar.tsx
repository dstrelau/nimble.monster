"use client";

import { Crown, User } from "lucide-react";
import { FilterBar } from "@/app/ui/FilterBar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SortSelect } from "./SortSelect";

export type LegendaryFilter = "all" | "legendary" | "standard";
export type SortOption =
  | "name-asc"
  | "name-desc"
  | "level-asc"
  | "level-desc"
  | "hp-asc"
  | "hp-desc"
  | "created-asc"
  | "created-desc";

interface SimpleFilterBarProps {
  searchTerm: string;
  legendaryFilter: LegendaryFilter;
  sortOption: SortOption;
  onSearch: (value: string) => void;
  onLegendaryFilterChange: (filter: LegendaryFilter) => void;
  onSortChange: (sort: SortOption) => void;
}

export const SimpleFilterBar: React.FC<SimpleFilterBarProps> = ({
  searchTerm,
  legendaryFilter,
  sortOption,
  onSearch,
  onLegendaryFilterChange,
  onSortChange,
}) => {
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearch={onSearch}
      searchPlaceholder="Search"
    >
      <ToggleGroup
        type="single"
        variant="outline"
        value={legendaryFilter}
        onValueChange={(value) => {
          if (value) onLegendaryFilterChange(value as LegendaryFilter);
        }}
      >
        <ToggleGroupItem value="all" aria-label="All monsters" className="px-6">
          <User className="h-4 w-4" />
          +
          <Crown className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="standard" aria-label="Standard monsters">
          <User className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="legendary" aria-label="Legendary monsters">
          <Crown className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <SortSelect value={sortOption} onChange={onSortChange} />
    </FilterBar>
  );
};
