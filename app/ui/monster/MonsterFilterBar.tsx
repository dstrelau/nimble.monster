"use client";

import { Crown, PersonStanding, User } from "lucide-react";
import { FilterBar } from "@/app/ui/FilterBar";
import { SortSelect } from "@/components/app/SortSelect";
import { SourceFilter } from "@/components/app/SourceFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import { MONSTER_LEVELS, MONSTER_ROLES } from "@/lib/services/monsters/types";

interface SimpleFilterBarProps {
  searchTerm: string | null;
  typeFilter: MonsterTypeOption;
  onTypeFilterChange: (filter: MonsterTypeOption) => void;
  sortOption: PaginateMonstersSortOption;
  onSearch: (value: string | null) => void;
  onSortChange: (sort: PaginateMonstersSortOption) => void;
  sourceId: string | null;
  onSourceChange: (sourceId: string | null) => void;
  role: MonsterRole | null;
  onRoleChange: (role: MonsterRole | null) => void;
  level: number | null;
  onLevelChange: (level: number | null) => void;
  beforeFilters?: React.ReactNode;
}

const TYPE_OPTIONS: {
  value: MonsterTypeOption;
  label: string;
  icon?: React.ReactNode;
}[] = [
  { value: "all", label: "All Types" },
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

export const MonsterFilterBar: React.FC<SimpleFilterBarProps> = ({
  searchTerm,
  typeFilter,
  onTypeFilterChange,
  sortOption,
  onSearch,
  onSortChange,
  sourceId,
  onSourceChange,
  role,
  onRoleChange,
  level,
  onLevelChange,
  beforeFilters,
}) => {
  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v ? v : null)}>
      {beforeFilters}
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
      <SourceFilter sourceId={sourceId} onSourceChange={onSourceChange} />
      <Select
        value={role ?? "none"}
        onValueChange={(v) =>
          onRoleChange(v === "none" ? null : (v as MonsterRole))
        }
      >
        <SelectTrigger className="min-w-36">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Roles</SelectItem>
          {MONSTER_ROLES.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={level?.toString() ?? "none"}
        onValueChange={(v) => onLevelChange(v === "none" ? null : Number(v))}
      >
        <SelectTrigger className="min-w-36">
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">All Levels</SelectItem>
          {MONSTER_LEVELS.map(({ label, value }) => (
            <SelectItem key={value} value={value.toString()}>
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
