"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listPublicSubclassesAction } from "@/app/actions/subclass";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { SubclassFilterBar } from "@/app/ui/subclass/SubclassFilterBar";
import { SubclassMiniCard } from "@/app/ui/subclass/SubclassMiniCard";
import type { Subclass, SubclassSortOption } from "@/lib/types";

interface SelectableSubclassGridProps {
  selectedIds: Set<string>;
  onToggle: (subclass: Subclass) => void;
}

export function SelectableSubclassGrid({
  selectedIds,
  onToggle,
}: SelectableSubclassGridProps) {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [sortOption, setSortOption] =
    useState<SubclassSortOption>("created-desc");
  const [classNameFilter, setClassNameFilter] = useState("all");
  const [source, setSourceId] = useState<string | null>(null);

  const {
    data: subclasses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subclasses-all"],
    queryFn: () => listPublicSubclassesAction(),
    staleTime: 30000,
  });

  const filteredSubclasses = useMemo(() => {
    if (!subclasses) return [];
    return subclasses
      .filter((subclass) => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const nameMatch = subclass.name.toLowerCase().includes(searchLower);
          const descriptionMatch = subclass.description
            ?.toLowerCase()
            .includes(searchLower);
          if (!nameMatch && !descriptionMatch) return false;
        }
        if (classNameFilter && classNameFilter !== "all") {
          if (subclass.className !== classNameFilter) return false;
        }
        if (source) {
          if (subclass.source?.id !== source) return false;
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
  }, [subclasses, searchTerm, sortOption, classNameFilter, source]);

  return (
    <div className="space-y-6">
      <SubclassFilterBar
        searchTerm={searchTerm}
        sortOption={sortOption}
        classNameFilter={classNameFilter}
        source={source}
        onSearch={setSearchTerm}
        onSortChange={setSortOption}
        onClassNameChange={setClassNameFilter}
        onSourceChange={setSourceId}
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load"}
        />
      ) : filteredSubclasses.length === 0 ? (
        <EmptyState entityName="subclasses" />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {filteredSubclasses.map((subclass) => (
            <SubclassMiniCard
              key={subclass.id}
              subclass={subclass}
              selectable
              selected={selectedIds.has(subclass.id)}
              onSelect={() => onToggle(subclass)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
