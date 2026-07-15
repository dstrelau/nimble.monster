"use client";

import { FilterBar } from "@/components/shared/FilterBar";
import { SortSelect } from "@/components/shared/SortSelect";
import { SourceFilter } from "@/components/shared/SourceFilter";
import type { PaginateAncestriesSortOption } from "@/lib/services/ancestries/service";

interface FilterBarProps {
  searchTerm: string | null;
  sortOption: string;
  onSearch: (search: string | null) => void;
  onSortChange: (sort: PaginateAncestriesSortOption) => void;
  source: string | null;
  onSourceChange: (source: string | null) => void;
}

const SORT_OPTIONS: {
  value: PaginateAncestriesSortOption;
  label: string;
}[] = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "-likes", label: "Most Liked" },
  { value: "name", label: "Name (A-Z)" },
  { value: "-name", label: "Name (Z-A)" },
];

export const AncestryFilterBar = ({
  searchTerm,
  sortOption,
  onSearch,
  onSortChange,
  source,
  onSourceChange,
}: FilterBarProps) => {
  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v || null)}>
      <SourceFilter
        source={source}
        onSourceChange={onSourceChange}
        entityType="ancestries"
      />
      <SortSelect
        items={SORT_OPTIONS}
        value={sortOption}
        onChange={(v) => onSortChange(v as PaginateAncestriesSortOption)}
      />
    </FilterBar>
  );
};
