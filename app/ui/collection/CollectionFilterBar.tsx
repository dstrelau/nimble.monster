"use client";

import type { CollectionSortOption } from "@/app/collections/actions";
import { FilterBar } from "@/app/ui/FilterBar";
import { CollectionSortSelect } from "./CollectionSortSelect";

interface CollectionFilterBarProps {
  searchTerm: string | null;
  sortOption: CollectionSortOption;
  onSearch: (value: string | null) => void;
  onSortChange: (sort: string | null) => void;
}

export const CollectionFilterBar: React.FC<CollectionFilterBarProps> = ({
  searchTerm,
  sortOption,
  onSearch,
  onSortChange,
}) => {
  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v ? v : null)}>
      <CollectionSortSelect value={sortOption} onChange={onSortChange} />
    </FilterBar>
  );
};
