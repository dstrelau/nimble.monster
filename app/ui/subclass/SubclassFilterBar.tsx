"use client";

import { FilterBar } from "@/app/ui/FilterBar";
import type { SubclassSortOption } from "@/lib/types";
import { SubclassClassSelect } from "./SubclassClassSelect";
import { SubclassSortSelect } from "./SubclassSortSelect";

interface SubclassFilterBarProps {
  searchTerm: string;
  sortOption: SubclassSortOption;
  classNameFilter: string;
  onSearch: (value: string) => void;
  onSortChange: (sort: SubclassSortOption) => void;
  onClassNameChange: (className: string) => void;
}

export const SubclassFilterBar: React.FC<SubclassFilterBarProps> = ({
  searchTerm,
  sortOption,
  classNameFilter,
  onSearch,
  onSortChange,
  onClassNameChange,
}) => {
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearch={onSearch}
    >
      <SubclassClassSelect
        value={classNameFilter}
        onChange={onClassNameChange}
      />
      <SubclassSortSelect value={sortOption} onChange={onSortChange} />
    </FilterBar>
  );
};
