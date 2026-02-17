"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { publicAncestriesInfiniteQueryOptions } from "@/app/ancestries/hooks";
import { AncestryFilterBar } from "@/app/ui/ancestry/AncestryFilterBar";
import { Card } from "@/app/ui/ancestry/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import type { Ancestry } from "@/lib/services/ancestries";

interface SelectableAncestryGridProps {
  selectedIds: Set<string>;
  onToggle: (ancestry: Ancestry) => void;
}

export function SelectableAncestryGrid({
  selectedIds,
  onToggle,
}: SelectableAncestryGridProps) {
  const [rawSearch, setRawSearch] = useState<string | null>(null);
  const [search] = useDebouncedValue(rawSearch, { wait: 250 });
  const [sort, setSort] = useState<
    "-createdAt" | "createdAt" | "name" | "-name"
  >("-createdAt");

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicAncestriesInfiniteQueryOptions({
        search: search ?? undefined,
        sort,
        limit: 12,
      })
    );

  const ancestries = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <AncestryFilterBar
        searchTerm={search}
        sortOption={sort}
        onSearch={setRawSearch}
        onSortChange={setSort}
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !ancestries || ancestries.length === 0 ? (
        <EmptyState entityName="ancestries" />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {ancestries.map((ancestry) => (
            <Card
              key={ancestry.id}
              ancestry={ancestry}
              creator={ancestry.creator}
              hideDescription={true}
              selectable
              selected={selectedIds.has(ancestry.id)}
              onSelect={() => onToggle(ancestry)}
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
