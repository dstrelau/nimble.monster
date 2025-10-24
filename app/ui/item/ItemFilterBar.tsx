"use client";

import type React from "react";
import type { ItemSortOption } from "@/app/items/actions";
import { FilterBar } from "@/app/ui/FilterBar";
import { SortSelect } from "@/components/app/SortSelect";
import { SourceFilter } from "@/components/app/SourceFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ItemRarity, RARITIES } from "@/lib/services/items";

interface ItemFilterBarProps {
  searchTerm: string | null;
  sortOption: ItemSortOption;
  rarityFilter: ItemRarity | "all";
  onSearch: (value: string | null) => void;
  onSortChange: (sort: ItemSortOption) => void;
  onRarityChange: (rarity: ItemRarity | "all") => void;
  sourceId: string | null;
  onSourceChange: (sourceId: string | null) => void;
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
  sourceId,
  onSourceChange,
}) => {
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearch={(v) => onSearch(v ? v : null)}
    >
      <Select
        value={rarityFilter}
        onValueChange={(value) => onRarityChange(value as ItemRarity | "all")}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Rarities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Rarities</SelectItem>
          {RARITIES.map((rarity) => (
            <SelectItem key={rarity.value} value={rarity.value}>
              {rarity.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <SourceFilter sourceId={sourceId} onSourceChange={onSourceChange} />

      <SortSelect
        items={SORT_OPTIONS}
        value={sortOption}
        onChange={onSortChange}
      />
    </FilterBar>
  );
};
