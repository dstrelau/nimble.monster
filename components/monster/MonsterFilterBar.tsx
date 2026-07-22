"use client";

import {
  ArrowDownUp,
  Crown,
  PersonStanding,
  SlidersHorizontal,
  User,
  Users,
} from "lucide-react";
import { FilterBar } from "@/components/shared/FilterBar";
import { SortSelect } from "@/components/shared/SortSelect";
import { SourceFilter } from "@/components/shared/SourceFilter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  source: string | null;
  onSourceChange: (source: string | null) => void;
  role: MonsterRole | null;
  onRoleChange: (role: MonsterRole | null) => void;
  level: number | null;
  onLevelChange: (level: number | null) => void;
  beforeFilters?: React.ReactNode;
  /** Collapse creator/type/source/role/level/sort into a single popover menu. */
  compact?: boolean;
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
  { value: "teams", label: "Teams", icon: <Users size={4} /> },
];

const SORT_OPTIONS: { value: PaginateMonstersSortOption; label: string }[] = [
  { value: "-createdAt", label: "Newest First" },
  { value: "createdAt", label: "Oldest First" },
  { value: "-likes", label: "Most Liked" },
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
  source,
  onSourceChange,
  role,
  onRoleChange,
  level,
  onLevelChange,
  beforeFilters,
  compact = false,
}) => {
  const filterControls = (
    <>
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className={compact ? "w-full" : "min-w-36"}>
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
      <SourceFilter
        source={source}
        onSourceChange={onSourceChange}
        entityType="monsters"
      />
      <Select
        value={role ?? "none"}
        onValueChange={(v) =>
          onRoleChange(v === "none" ? null : (v as MonsterRole))
        }
      >
        <SelectTrigger className={compact ? "w-full" : "min-w-36"}>
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
        <SelectTrigger className={compact ? "w-full" : "min-w-36"}>
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
    </>
  );

  const sortControl = (
    <SortSelect
      items={SORT_OPTIONS}
      value={sortOption}
      onChange={onSortChange}
    />
  );

  if (!compact) {
    return (
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(v) => onSearch(v ? v : null)}
      >
        {beforeFilters}
        {filterControls}
        {sortControl}
      </FilterBar>
    );
  }

  const activeFilterCount = [
    typeFilter !== "all",
    source !== null,
    role !== null,
    level !== null,
  ].filter(Boolean).length;

  return (
    <FilterBar searchTerm={searchTerm} onSearch={(v) => onSearch(v ? v : null)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative shrink-0">
            <SlidersHorizontal />
            {activeFilterCount > 0 && (
              <span className="-top-1.5 -right-1.5 absolute flex size-4 items-center justify-center rounded-full bg-flame text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-56 flex-col gap-2">
          {beforeFilters}
          {filterControls}
        </PopoverContent>
      </Popover>
      <Select value={sortOption} onValueChange={onSortChange}>
        <SelectTrigger
          aria-label="Sort"
          className="size-9 shrink-0 justify-center p-0 [&>svg:last-child]:hidden"
        >
          <ArrowDownUp />
        </SelectTrigger>
        <SelectContent align="end">
          {SORT_OPTIONS.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterBar>
  );
};
