"use client";

import { FilterBar } from "@/app/ui/FilterBar";
import { EmptyState } from "@/app/ui/shared/GridStates";
import { SourceFilter } from "@/components/app/SourceFilter";
import { useSchoolFilters } from "@/lib/hooks/useSchoolFilters";
import type { SpellSchool } from "@/lib/types";
import { Card } from "./Card";
import { SchoolSortSelect } from "./SchoolSortSelect";

interface SchoolsListViewProps {
  spellSchools: SpellSchool[];
}

export function SchoolsListView({ spellSchools }: SchoolsListViewProps) {
  const {
    searchTerm,
    sortOption,
    source,
    filteredSchools,
    handleSearch,
    setSortOption,
    setSource,
  } = useSchoolFilters({ spellSchools });

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(v) => handleSearch(v || null)}
      >
        <SourceFilter
          source={source}
          onSourceChange={setSource}
          entityType="spell_schools"
        />
        <SchoolSortSelect value={sortOption} onChange={setSortOption} />
      </FilterBar>

      {filteredSchools.length === 0 ? (
        <EmptyState entityName="spell schools" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredSchools.map((school) => (
            <Card key={school.id} spellSchool={school} mini={true} />
          ))}
        </div>
      )}
    </div>
  );
}
