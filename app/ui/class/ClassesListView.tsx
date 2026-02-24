"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { useMemo } from "react";
import { FilterBar } from "@/app/ui/FilterBar";
import { EmptyState } from "@/app/ui/shared/GridStates";
import { SourceFilter } from "@/components/app/SourceFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Class } from "@/lib/types";
import { ClassMiniCard } from "./ClassMiniCard";

const SortOptions = [
  "name-asc",
  "name-desc",
  "created-asc",
  "created-desc",
] as const;

type SortOption = (typeof SortOptions)[number];

const SORT_LABELS: { value: SortOption; label: string }[] = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "created-desc", label: "Newest First" },
  { value: "created-asc", label: "Oldest First" },
];

interface ClassesListViewProps {
  classes: Class[];
}

export const ClassesListView: React.FC<ClassesListViewProps> = ({
  classes,
}) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });
  const [sortQuery, setSortQuery] = useQueryState(
    "sort",
    parseAsStringLiteral(SortOptions).withDefault("created-desc")
  );
  const [sourceQuery, setSourceQuery] = useQueryState("source", parseAsString);

  const filtered = useMemo((): Class[] => {
    return classes
      .filter((c) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !c.name.toLowerCase().includes(q) &&
            !c.description?.toLowerCase().includes(q)
          )
            return false;
        }
        if (sourceQuery) {
          if (c.source?.abbreviation !== sourceQuery) return false;
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
  }, [classes, searchQuery, sortQuery, sourceQuery]);

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchQuery}
        onSearch={(v) => setSearchQuery(v || null)}
      >
        <SourceFilter
          source={sourceQuery}
          onSourceChange={setSourceQuery}
          entityType="classes"
        />
        <Select
          value={sortQuery}
          onValueChange={(v) => {
            const opt = SortOptions.find((o) => o === v);
            if (opt) setSortQuery(opt);
          }}
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

      {filtered.length === 0 ? (
        <EmptyState entityName="classes" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filtered.map((c) => (
            <ClassMiniCard key={c.id} classEntity={c} />
          ))}
        </div>
      )}
    </div>
  );
};
