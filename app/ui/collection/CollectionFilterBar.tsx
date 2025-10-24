"use client";

import { FilterBar } from "@/app/ui/FilterBar";
import type { CollectionSortOption } from "@/lib/hooks/useCollectionFilters";
import { CollectionSortSelect } from "./CollectionSortSelect";

interface CollectionFilterBarProps {
  searchTerm: string;
  sortOption: CollectionSortOption;
  onSearch: (value: string) => void;
  onSortChange: (sort: CollectionSortOption) => void;
}

export const CollectionFilterBar: React.FC<CollectionFilterBarProps> = ({
  searchTerm,
  sortOption,
  onSearch,
  onSortChange,
}) => {
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearch={onSearch}
    >
      <CollectionSortSelect value={sortOption} onChange={onSortChange} />
    </FilterBar>
  );
};
