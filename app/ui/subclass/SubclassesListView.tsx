"use client";

import type React from "react";
import { SubclassMiniCard } from "@/app/ui/subclass/SubclassMiniCard";
import { useSubclassFilters } from "@/lib/hooks/useSubclassFilters";
import type { Subclass } from "@/lib/types";
import { SubclassFilterBar } from "./SubclassFilterBar";

interface SubclassesListViewProps {
  subclasses: Subclass[];
}

export const SubclassesListView: React.FC<SubclassesListViewProps> = ({
  subclasses,
}) => {
  const {
    searchTerm,
    sortOption,
    classNameFilter,
    filteredSubclasses,
    handleSearch,
    setSortOption,
    setClassNameFilter,
  } = useSubclassFilters({ subclasses });

  return (
    <div className="space-y-6">
      <SubclassFilterBar
        searchTerm={searchTerm}
        sortOption={sortOption}
        classNameFilter={classNameFilter}
        onSearch={handleSearch}
        onSortChange={setSortOption}
        onClassNameChange={setClassNameFilter}
      />

      {filteredSubclasses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || classNameFilter
              ? `No subclasses found matching your filters.`
              : "No subclasses found."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredSubclasses.map((subclass) => (
            <SubclassMiniCard key={subclass.id} subclass={subclass} />
          ))}
        </div>
      )}
    </div>
  );
};
