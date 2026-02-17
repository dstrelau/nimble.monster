"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { publicCompanionsInfiniteQueryOptions } from "@/app/companions/hooks";
import { Card } from "@/app/ui/companion/Card";
import { CompanionFilterBar } from "@/app/ui/companion/CompanionFilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import type {
  CompanionClassOption,
  PaginateCompanionsSortOption,
} from "@/lib/services/companions/types";
import type { Companion } from "@/lib/types";

interface SelectableCompanionGridProps {
  selectedIds: Set<string>;
  onToggle: (companion: Companion) => void;
}

export function SelectableCompanionGrid({
  selectedIds,
  onToggle,
}: SelectableCompanionGridProps) {
  const [rawSearch, setRawSearch] = useState<string | null>(null);
  const [search] = useDebouncedValue(rawSearch, { wait: 250 });
  const [sort, setSort] = useState<PaginateCompanionsSortOption>("-createdAt");
  const [classFilter, setClassFilter] = useState<CompanionClassOption>("all");

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicCompanionsInfiniteQueryOptions({
        search: search ?? undefined,
        sort,
        class: classFilter,
        limit: 6,
      })
    );

  const companions = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <CompanionFilterBar
        searchTerm={search}
        classFilter={classFilter}
        onClassFilterChange={setClassFilter}
        sortOption={sort}
        onSearch={setRawSearch}
        onSortChange={setSort}
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !companions || companions.length === 0 ? (
        <EmptyState entityName="companions" />
      ) : (
        <div className="flex flex-col gap-8">
          {companions.map((companion) => (
            <Card
              key={companion.id}
              companion={companion}
              creator={companion.creator}
              hideDescription={true}
              selectable
              selected={selectedIds.has(companion.id)}
              onSelect={() => onToggle(companion)}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <LoadMoreButton onClick={() => fetchNextPage()} disabled={isFetching} />
      )}
    </div>
  );
}
