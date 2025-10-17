"use client";

import { Crown, PersonStanding, User } from "lucide-react";
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
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";

interface SimpleFilterBarProps {
  searchTerm: string | null;
  typeFilter: MonsterTypeOption;
  onTypeFilterChange: (filter: MonsterTypeOption) => void;
  sortOption: PaginateMonstersSortOption;
  onSearch: (value: string | null) => void;
  onSortChange: (sort: PaginateMonstersSortOption) => void;
}

const TYPE_OPTIONS: {
  value: MonsterTypeOption;
  label: string;
  icon?: React.ReactNode;
}[] = [
  { value: "all", label: "All" },
  { value: "standard", label: "Standard", icon: <User size={4} /> },
  { value: "legendary", label: "Legendary", icon: <Crown size={4} /> },
  { value: "minion", label: "Minion", icon: <PersonStanding size={4} /> },
];

const SORT_OPTIONS: { value: PaginateMonstersSortOption; label: string }[] = [
  { value: "-createdAt", label: "Newest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "name", label: "Name (A→Z)" },
  { value: "-name", label: "Name (Z→A)" },
  { value: "level", label: "Level (Low→High)" },
  { value: "-level", label: "Level (High→Low)" },
];

export const SimpleFilterBar: React.FC<SimpleFilterBarProps> = ({
  searchTerm,
  typeFilter,
  onTypeFilterChange,
  sortOption,
  onSearch,
  onSortChange,
}) => {
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearch={(v) => onSearch(v ? v : null)}
      searchPlaceholder="Search"
      layout="horizontal"
    >
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="min-w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map(({ label, value, icon }) => (
            <SelectItem key={value} value={value}>
              {icon}
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
