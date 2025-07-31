"use client";

import { ArrowDownUp, Crown, User } from "lucide-react";
import { SearchInput } from "@/app/ui/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

        <Select value={sortOption} onValueChange={onSortChange}>
          <SelectTrigger>
            <ArrowDownUp className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
