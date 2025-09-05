"use client";

import { ArrowDownUp } from "lucide-react";
import { SearchInput } from "@/app/ui/SearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ItemRarity, RARITIES } from "@/lib/types";

export type SortOption = "name-asc" | "name-desc";

interface SimpleFilterBarProps {
  searchTerm: string;
  sortOption: SortOption;
  rarityFilter?: ItemRarity | null;
  onSearch: (value: string) => void;
  onSortChange: (sort: SortOption) => void;
  onRarityChange: (rarity: ItemRarity | null) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A→Z)" },
  { value: "name-desc", label: "Name (Z→A)" },
];

export const SimpleFilterBar: React.FC<SimpleFilterBarProps> = ({
  searchTerm,
  sortOption,
  rarityFilter,
  onSearch,
  onSortChange,
  onRarityChange,
}) => {
  return (
    <div className="flex flex-col gap-3 pb-4">
      <SearchInput
        value={searchTerm}
        onChange={onSearch}
        placeholder="Search"
      />

      <div className="flex gap-3 items-center">
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

        <Select
          value={rarityFilter || "all"}
          onValueChange={(value) =>
            onRarityChange(value === "all" ? null : (value as ItemRarity))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All rarities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All rarities</SelectItem>
            {RARITIES.map((rarity) => (
              <SelectItem key={rarity.value} value={rarity.value}>
                {rarity.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
