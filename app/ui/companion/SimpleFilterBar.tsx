"use client";

import { ArrowDownUp } from "lucide-react";
import { SearchInput } from "@/app/ui/SearchInput";
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
    <div className="flex flex-col gap-3 pb-4">
      <SearchInput
        value={searchTerm}
        onChange={onSearch}
        placeholder="Search"
      />

      <div className="flex gap-3 items-center">
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
      </div>
    </div>
  );
};
