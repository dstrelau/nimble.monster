"use client";

import { FilterBar } from "@/app/ui/FilterBar";
import { SortSelect } from "@/components/app/SortSelect";
import { SourceFilter } from "@/components/app/SourceFilter";

interface FilterBarProps {
  searchTerm: string | null;
  sortOption: string;
  onSearch: (search: string | null) => void;
  onSortChange: (sort: "name" | "createdAt" | "-name" | "-createdAt") => void;
  source: string | null;
  onSourceChange: (source: string | null) => void;
}

const SORT_OPTIONS: {
  value: "name" | "createdAt" | "-name" | "-createdAt";
  label: string;
}[] = [
  { value: "-createdAt", label: "Newest" },
  { value: "createdAt", label: "Oldest" },
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
        onChange={(v) =>
          onSortChange(v as "name" | "createdAt" | "-name" | "-createdAt")
        }
      />
    </FilterBar>
  );
};
