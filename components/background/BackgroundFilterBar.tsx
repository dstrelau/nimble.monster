"use client";

import { FilterBar } from "@/components/shared/FilterBar";
import { SortSelect } from "@/components/shared/SortSelect";
import { SourceFilter } from "@/components/shared/SourceFilter";
import type { PaginateBackgroundsSortOption } from "@/lib/services/backgrounds/service";

interface FilterBarProps {
  searchTerm: string | null;
  sortOption: string;
  onSearch: (search: string | null) => void;
  onSortChange: (sort: PaginateBackgroundsSortOption) => void;
  source: string | null;
  onSourceChange: (source: string | null) => void;
}

const SORT_OPTIONS: {
  value: PaginateBackgroundsSortOption;
  label: string;
}[] = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
  { value: "-likes", label: "Most Liked" },
  { value: "name", label: "Name (A-Z)" },
  { value: "-name", label: "Name (Z-A)" },
];

export const BackgroundFilterBar = ({
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
        entityType="backgrounds"
      />
      <SortSelect
        items={SORT_OPTIONS}
        value={sortOption}
        onChange={(v) => onSortChange(v as PaginateBackgroundsSortOption)}
      />
    </FilterBar>
  );
};
