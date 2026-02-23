"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { publicBackgroundsInfiniteQueryOptions } from "@/app/backgrounds/hooks";
import { BackgroundFilterBar } from "@/app/ui/background/BackgroundFilterBar";
import { Card } from "@/app/ui/background/Card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import type { Background } from "@/lib/services/backgrounds";

interface SelectableBackgroundGridProps {
  selectedIds: Set<string>;
  onToggle: (background: Background) => void;
}

export function SelectableBackgroundGrid({
  selectedIds,
  onToggle,
}: SelectableBackgroundGridProps) {
  const [rawSearch, setRawSearch] = useState<string | null>(null);
  const [search] = useDebouncedValue(rawSearch, { wait: 250 });
  const [sort, setSort] = useState<
    "-createdAt" | "createdAt" | "name" | "-name"
  >("-createdAt");
  const [source, setSourceId] = useState<string | null>(null);

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicBackgroundsInfiniteQueryOptions({
        search: search ?? undefined,
        sort,
        source: source ?? undefined,
        limit: 12,
      })
    );

  const backgrounds = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <BackgroundFilterBar
        searchTerm={search}
        sortOption={sort}
        onSearch={setRawSearch}
        onSortChange={setSort}
        source={source}
        onSourceChange={setSourceId}
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !backgrounds || backgrounds.length === 0 ? (
        <EmptyState entityName="backgrounds" />
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-start">
          {backgrounds.map((background) => (
            <Card
              key={background.id}
              background={background}
              creator={background.creator}
              selectable
              selected={selectedIds.has(background.id)}
              onSelect={() => onToggle(background)}
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
