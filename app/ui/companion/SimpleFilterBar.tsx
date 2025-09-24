"use client";

import { ArrowDownUp } from "lucide-react";
import { FilterBar } from "@/app/ui/FilterBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "kind-asc"
  | "kind-desc"
  | "class-asc"
  | "class-desc";

interface SimpleFilterBarProps {
  searchTerm: string;
  sortOption: SortOption;
  onSearch: (value: string) => void;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name (A→Z)" },
  { value: "name-desc", label: "Name (Z→A)" },
  { value: "kind-asc", label: "Kind (A→Z)" },
  { value: "kind-desc", label: "Kind (Z→A)" },
  { value: "class-asc", label: "Class (A→Z)" },
  { value: "class-desc", label: "Class (Z→A)" },
];

export const SimpleFilterBar: React.FC<SimpleFilterBarProps> = ({
  searchTerm,
  sortOption,
  onSearch,
  onSortChange,
}) => {
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearch={onSearch}
      searchPlaceholder="Search"
    >
      <Select value={sortOption} onValueChange={onSortChange}>
        <SelectTrigger>
          <ArrowDownUp className="h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterBar>
  );
};
