"use client";

import type { EncounterSortOption } from "@/app/encounters/actions";
import { FilterBar } from "@/components/shared/FilterBar";
import { EncounterSortSelect } from "./EncounterSortSelect";

interface EncounterFilterBarProps {
  searchTerm: string | null;
  sortOption: EncounterSortOption;
  onSearch: (value: string | null) => void;
  onSortChange: (sort: string | null) => void;
}

export const EncounterFilterBar: React.FC<EncounterFilterBarProps> = ({
  searchTerm,
  sortOption,
  onSearch,
  onSortChange,
}) => {
  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v ? v : null)}>
      <EncounterSortSelect value={sortOption} onChange={onSortChange} />
    </FilterBar>
  );
};
