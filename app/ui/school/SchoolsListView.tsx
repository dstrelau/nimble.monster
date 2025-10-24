"use client";

import { FilterBar } from "@/app/ui/FilterBar";
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
    filteredSchools,
    handleSearch,
    setSortOption,
  } = useSchoolFilters({ spellSchools });

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchTerm}
        onSearch={handleSearch}
      >
        <SchoolSortSelect value={sortOption} onChange={setSortOption} />
      </FilterBar>

      {filteredSchools.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm
              ? "No spell schools found matching your filters."
              : "No spell schools found."}
          </p>
        </div>
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
