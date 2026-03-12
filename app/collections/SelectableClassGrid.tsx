"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listPublicClassesAction } from "@/app/actions/class";
import { ClassMiniCard } from "@/app/ui/class/ClassMiniCard";
import { FilterBar } from "@/app/ui/FilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { SourceFilter } from "@/components/app/SourceFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Class, ClassSortOption } from "@/lib/types";

const SORT_LABELS: { value: ClassSortOption; label: string }[] = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "created-desc", label: "Newest First" },
  { value: "created-asc", label: "Oldest First" },
];

interface SelectableClassGridProps {
  selectedIds: Set<string>;
  onToggle: (classEntity: Class) => void;
}

export function SelectableClassGrid({
  selectedIds,
  onToggle,
}: SelectableClassGridProps) {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<ClassSortOption>("created-desc");
  const [source, setSource] = useState<string | null>(null);

  const {
    data: classes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["classes-all"],
    queryFn: () => listPublicClassesAction(),
    staleTime: 30000,
  });

  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    return classes
      .filter((c) => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const nameMatch = c.name.toLowerCase().includes(searchLower);
          const descriptionMatch = c.description
            ?.toLowerCase()
            .includes(searchLower);
          if (!nameMatch && !descriptionMatch) return false;
        }
        if (source) {
          if (c.source?.abbreviation !== source) return false;
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
  }, [classes, searchTerm, sortOption, source]);

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(v) => setSearchTerm(v || null)}
      >
        <SourceFilter
          source={source}
          onSourceChange={setSource}
          entityType="classes"
        />
        <Select
          value={sortOption}
          onValueChange={(v) => setSortOption(v as ClassSortOption)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_LABELS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load"}
        />
      ) : filteredClasses.length === 0 ? (
        <EmptyState entityName="classes" />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {filteredClasses.map((classEntity) => (
            <ClassMiniCard
              key={classEntity.id}
              classEntity={classEntity}
              selectable
              selected={selectedIds.has(classEntity.id)}
              onSelect={() => onToggle(classEntity)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
