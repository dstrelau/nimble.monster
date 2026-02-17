"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listPublicSpellSchoolsAction } from "@/app/spell-schools/actions";
import { FilterBar } from "@/app/ui/FilterBar";
import { Card } from "@/app/ui/school/Card";
import { SchoolSortSelect } from "@/app/ui/school/SchoolSortSelect";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import type { SpellSchool, SpellSchoolSortOption } from "@/lib/types";

interface SelectableSpellSchoolGridProps {
  selectedIds: Set<string>;
  onToggle: (spellSchool: SpellSchool) => void;
}

export function SelectableSpellSchoolGrid({
  selectedIds,
  onToggle,
}: SelectableSpellSchoolGridProps) {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [sortOption, setSortOption] =
    useState<SpellSchoolSortOption>("created-desc");

  const {
    data: spellSchools,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["spellSchools-all"],
    queryFn: () => listPublicSpellSchoolsAction(),
    staleTime: 30000,
  });

  const filteredSchools = useMemo(() => {
    if (!spellSchools) return [];
    return spellSchools
      .filter((school) => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const nameMatch = school.name.toLowerCase().includes(searchLower);
          const descriptionMatch = school.description
            ?.toLowerCase()
            .includes(searchLower);
          const spellMatch = school.spells.some((spell) =>
            spell.name.toLowerCase().includes(searchLower)
          );
          if (!nameMatch && !descriptionMatch && !spellMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const [field, direction] = sortOption.split("-");
        if (field === "name") {
          const result = a.name.localeCompare(b.name);
          return direction === "asc" ? result : -result;
        }
        if (field === "created") {
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          const result = dateA.getTime() - dateB.getTime();
          return direction === "asc" ? result : -result;
        }
        return 0;
      });
  }, [spellSchools, searchTerm, sortOption]);

  return (
    <div className="space-y-6">
      <FilterBar searchTerm={searchTerm} onSearch={setSearchTerm}>
        <SchoolSortSelect value={sortOption} onChange={setSortOption} />
      </FilterBar>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load"}
        />
      ) : filteredSchools.length === 0 ? (
        <EmptyState entityName="spell schools" />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {filteredSchools.map((school) => (
            <Card
              key={school.id}
              spellSchool={school}
              creator={school.creator}
              mini={true}
              selectable
              selected={selectedIds.has(school.id)}
              onSelect={() => onToggle(school)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
