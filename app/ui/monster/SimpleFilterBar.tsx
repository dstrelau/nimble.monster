"use client";

import { Crown, User } from "lucide-react";
import { SearchInput } from "@/app/ui/SearchInput";
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
    <div className="flex flex-col gap-3 pb-4">
      <SearchInput
        value={searchTerm}
        onChange={onSearch}
        placeholder="Search"
      />

      <div className="flex gap-3 items-center">
        <ToggleGroup
          type="single"
          variant="outline"
          value={legendaryFilter}
          onValueChange={(value) => {
            if (value) onLegendaryFilterChange(value as LegendaryFilter);
          }}
        >
          <ToggleGroupItem
            value="all"
            aria-label="All monsters"
            className="px-6"
          >
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
      </div>
    </div>
  );
};
