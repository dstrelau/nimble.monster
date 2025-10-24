"use client";

import { FilterBar } from "@/app/ui/FilterBar";
import { SortSelect } from "@/components/app/SortSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CompanionClassOption,
  PaginateCompanionsSortOption,
} from "@/lib/services/companions/types";
import { SUBCLASS_CLASSES } from "@/lib/types";

interface SimpleFilterBarProps {
  searchTerm: string | null;
  classFilter: CompanionClassOption;
  onClassFilterChange: (filter: CompanionClassOption) => void;
  sortOption: PaginateCompanionsSortOption;
  onSearch: (value: string | null) => void;
  onSortChange: (sort: PaginateCompanionsSortOption) => void;
}

const CLASS_OPTIONS: {
  value: CompanionClassOption;
  label: string;
}[] = [{ value: "all", label: "All Classes" }, ...SUBCLASS_CLASSES];

const SORT_OPTIONS: { value: PaginateCompanionsSortOption; label: string }[] = [
  { value: "-createdAt", label: "Newest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "name", label: "Name (A→Z)" },
  { value: "-name", label: "Name (Z→A)" },
];

export const CompanionFilterBar: React.FC<SimpleFilterBarProps> = ({
  searchTerm,
  classFilter,
  onClassFilterChange,
  sortOption,
  onSearch,
  onSortChange,
}) => {
  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v ? v : null)}>
      <Select value={classFilter} onValueChange={onClassFilterChange}>
        <SelectTrigger className="min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CLASS_OPTIONS.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SortSelect
        items={SORT_OPTIONS}
        value={sortOption}
        onChange={onSortChange}
      />
    </FilterBar>
  );
};
