"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type React from "react";
import { EncounterCard } from "@/app/ui/EncounterCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import {
  type EncounterSortOption,
  publicEncountersInfiniteQueryOptions,
} from "../../encounters/actions";
import { EncounterFilterBar } from "./EncounterFilterBar";

export const EncountersListView: React.FC = () => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState("sort", {
    defaultValue: "-createdAt",
  });

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicEncountersInfiniteQueryOptions({
        sort: sortQuery,
        search: searchQuery || undefined,
      })
    );

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const filteredEncounters = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <EncounterFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery as EncounterSortOption}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
      />

      {!filteredEncounters || filteredEncounters?.length === 0 ? (
        <EmptyState entityName="encounters" />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 items-start">
            {filteredEncounters.map((encounter) => (
              <EncounterCard key={encounter.id} encounter={encounter} />
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
