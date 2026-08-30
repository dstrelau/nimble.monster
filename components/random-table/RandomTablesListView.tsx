"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type React from "react";
import {
  isRandomTableSortOption,
  publicRandomTablesInfiniteQueryOptions,
} from "@/app/random-tables/actions";
import { RandomTableCard } from "@/components/random-table/RandomTableCard";
import { FilterBar } from "@/components/shared/FilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { LoadMoreButton } from "@/components/shared/LoadMoreButton";
import { RandomTableSortSelect } from "./RandomTableSortSelect";

export const RandomTablesListView: React.FC = () => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState("sort", {
    defaultValue: "-createdAt",
  });
  const sort = isRandomTableSortOption(sortQuery) ? sortQuery : "-createdAt";

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicRandomTablesInfiniteQueryOptions({
        sort,
        search: searchQuery || undefined,
      })
    );

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const randomTables = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchQuery}
        onSearch={(v) => setSearchQuery(v ? v : null)}
      >
        <RandomTableSortSelect value={sort} onChange={setSortQuery} />
      </FilterBar>

      {!randomTables || randomTables.length === 0 ? (
        <EmptyState entityName="random tables" />
      ) : (
        <>
          <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
            {randomTables.map((randomTable) => (
              <RandomTableCard key={randomTable.id} randomTable={randomTable} />
            ))}
          </div>
          {hasNextPage && (
            <LoadMoreButton
              onClick={() => fetchNextPage()}
              disabled={isFetching}
            />
          )}
        </>
      )}
    </div>
  );
};
