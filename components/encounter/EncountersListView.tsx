"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type React from "react";
import {
  type EncounterSortOption,
  publicEncountersInfiniteQueryOptions,
} from "@/app/encounters/actions";
import { myEncountersInfiniteQueryOptions } from "@/app/my/encounters/hooks";
import { EncounterCard } from "@/components/encounter/EncounterCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { LoadMoreButton } from "@/components/shared/LoadMoreButton";
import { EncounterFilterBar } from "./EncounterFilterBar";

// we can't directly pass the queryOptions fn here because props to client
// components must be serializable.
export type EncountersListViewProps =
  | { kind: "encounters" | "my-encounters" }
  | { kind: "user-encounters"; creatorId: string };

export const EncountersListView: React.FC<EncountersListViewProps> = (
  props
) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState("sort", {
    defaultValue: "-createdAt",
  });

  const params = {
    sort: sortQuery,
    search: searchQuery || undefined,
  };
  const queryOptions = () => {
    switch (props.kind) {
      case "user-encounters":
        return publicEncountersInfiniteQueryOptions({
          ...params,
          creatorId: props.creatorId,
        });
      case "my-encounters":
        return myEncountersInfiniteQueryOptions(params);
      case "encounters":
        return publicEncountersInfiniteQueryOptions(params);
    }
  };

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(queryOptions());

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
