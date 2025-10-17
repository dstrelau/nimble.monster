"use client";

import { ArrowDownUp } from "lucide-react";
import type React from "react";
import type { ItemSortOption } from "@/app/items/actions";
import { FilterBar } from "@/app/ui/FilterBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ItemRarity, RARITIES } from "@/lib/services/items";
import { SortSelect } from "@/components/app/SortSelect";

interface ItemFilterBarProps {
  searchTerm: string | null;
  sortOption: ItemSortOption;
  rarityFilter: ItemRarity | "all";
  onSearch: (value: string | null) => void;
  onSortChange: (sort: ItemSortOption) => void;
  onRarityChange: (rarity: ItemRarity | "all") => void;
}

const SORT_OPTIONS: { value: ItemSortOption; label: string }[] = [
  { value: "-createdAt", label: "Newest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "name", label: "Name (A→Z)" },
  { value: "-name", label: "Name (Z→A)" },
];

export const ItemFilterBar: React.FC<ItemFilterBarProps> = ({
  searchTerm,
  sortOption,
  rarityFilter,
  onSearch,
  onSortChange,
  onRarityChange,
}) => {
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearch={(v) => onSearch(v ? v : null)}
      searchPlaceholder="Search"
      layout="horizontal"
    >
      <Select
        value={rarityFilter}
        onValueChange={(value) => onRarityChange(value as ItemRarity | "all")}
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

      <SortSelect
        items={SORT_OPTIONS}
        value={sortOption}
        onChange={onSortChange}
      />
    </FilterBar>
  );
};
