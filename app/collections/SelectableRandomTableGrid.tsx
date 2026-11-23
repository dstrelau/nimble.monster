"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { publicRandomTables } from "@/app/%5Factions/publicRandomTables/contract";
import { RandomTableMiniCard } from "@/components/random-table/RandomTableMiniCard";
import { FilterBar } from "@/components/shared/FilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { call } from "@/lib/contract";
import type { RandomTableMini } from "@/lib/types";

const publicRandomTablesQueryOptions = () =>
  queryOptions({
    queryKey: ["random-tables", "picker"],
    queryFn: async ({ signal }) =>
      (await call(publicRandomTables, undefined, { signal })).data,
  });

interface SelectableRandomTableGridProps {
  selectedIds: Set<string>;
  onToggle: (randomTable: RandomTableMini) => void;
}

export function SelectableRandomTableGrid({
  selectedIds,
  onToggle,
}: SelectableRandomTableGridProps) {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(publicRandomTablesQueryOptions());

  const filtered = useMemo(() => {
    const search = searchTerm?.toLowerCase();
    return (data ?? []).filter(
      (rule) => !search || rule.name.toLowerCase().includes(search)
    );
  }, [data, searchTerm]);

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchTerm}
        onSearch={(v) => setSearchTerm(v || null)}
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState entityName="reference tables" />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {filtered.map((rule) => (
            <RandomTableMiniCard
              key={rule.id}
              randomTable={rule}
              selectable
              selected={selectedIds.has(rule.id)}
              onSelect={() => onToggle(rule)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
