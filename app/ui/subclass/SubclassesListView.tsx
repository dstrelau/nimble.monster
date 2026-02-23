"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { useMemo } from "react";
import { EmptyState } from "@/app/ui/shared/GridStates";
import { SubclassMiniCard } from "@/app/ui/subclass/SubclassMiniCard";
import type { Subclass, SubclassSortOption } from "@/lib/types";
import { SubclassFilterBar } from "./SubclassFilterBar";

const SubclassSortOptions = [
  "name-asc",
  "name-desc",
  "created-asc",
  "created-desc",
] as const;

interface SubclassesListViewProps {
  subclasses: Subclass[];
}

export const SubclassesListView: React.FC<SubclassesListViewProps> = ({
  subclasses,
}) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState(
    "sort",
    parseAsStringLiteral(SubclassSortOptions).withDefault("created-desc")
  );
  const [classNameQuery, setClassNameQuery] = useQueryState(
    "className",
    parseAsString.withDefault("all")
  );
  const [sourceQuery, setSourceQuery] = useQueryState("source", parseAsString);

  const filteredSubclasses = useMemo((): Subclass[] => {
    return subclasses
      .filter((subclass) => {
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const nameMatch = subclass.name.toLowerCase().includes(searchLower);
          const descriptionMatch = subclass.description
            ?.toLowerCase()
            .includes(searchLower);
          if (!nameMatch && !descriptionMatch) return false;
        }
        if (classNameQuery && classNameQuery !== "all") {
          if (subclass.className !== classNameQuery) return false;
        }
        if (sourceQuery) {
          if (subclass.source?.abbreviation !== sourceQuery) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const [field, direction] = sortQuery.split("-");
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
  }, [subclasses, searchQuery, sortQuery, classNameQuery, sourceQuery]);

  return (
    <div className="space-y-6">
      <SubclassFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery as SubclassSortOption}
        classNameFilter={classNameQuery}
        source={sourceQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
        onClassNameChange={setClassNameQuery}
        onSourceChange={setSourceQuery}
      />

      {filteredSubclasses.length === 0 ? (
        <EmptyState entityName="subclasses" />
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
