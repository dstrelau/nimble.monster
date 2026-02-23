"use client";

import { FilterBar } from "@/app/ui/FilterBar";
import { SourceFilter } from "@/components/app/SourceFilter";
import type { SubclassSortOption } from "@/lib/types";
import { SubclassClassSelect } from "./SubclassClassSelect";
import { SubclassSortSelect } from "./SubclassSortSelect";

interface SubclassFilterBarProps {
  searchTerm: string | null;
  sortOption: SubclassSortOption;
  classNameFilter: string;
  source: string | null;
  onSearch: (value: string | null) => void;
  onSortChange: (sort: SubclassSortOption) => void;
  onClassNameChange: (className: string) => void;
  onSourceChange: (source: string | null) => void;
}

export const SubclassFilterBar: React.FC<SubclassFilterBarProps> = ({
  searchTerm,
  sortOption,
  classNameFilter,
  source,
  onSearch,
  onSortChange,
  onClassNameChange,
  onSourceChange,
}) => {
  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v || null)}>
      <SubclassClassSelect
        value={classNameFilter}
        onChange={onClassNameChange}
      />
      <SourceFilter
        source={source}
        onSourceChange={onSourceChange}
        entityType="subclasses"
      />
      <SubclassSortSelect value={sortOption} onChange={onSortChange} />
    </FilterBar>
  );
};
