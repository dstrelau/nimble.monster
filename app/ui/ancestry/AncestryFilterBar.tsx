"use client";

import { FilterBar } from "@/app/ui/FilterBar";
import { SortSelect } from "@/components/app/SortSelect";

interface FilterBarProps {
  searchTerm: string | null;
  sortOption: string;
  onSearch: (search: string | null) => void;
  onSortChange: (sort: "name" | "createdAt" | "-name" | "-createdAt") => void;
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

export const AncestryFilterBar = ({
  searchTerm,
  sortOption,
  onSearch,
  onSortChange,
}: FilterBarProps) => {
  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v || null)}>
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
