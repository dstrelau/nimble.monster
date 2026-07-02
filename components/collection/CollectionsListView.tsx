"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type React from "react";
import {
  type CollectionSortOption,
  publicCollectionsInfiniteQueryOptions,
} from "@/app/collections/actions";
import { CollectionCard } from "@/components/collection/CollectionCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { LoadMoreButton } from "@/components/shared/LoadMoreButton";
import { CollectionFilterBar } from "./CollectionFilterBar";

export const CollectionsListView: React.FC = () => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState("sort", {
    defaultValue: "-createdAt",
  });

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicCollectionsInfiniteQueryOptions({
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

  const filteredCollections = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <CollectionFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery as CollectionSortOption}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
      />

      {!filteredCollections || filteredCollections?.length === 0 ? (
        <EmptyState entityName="collections" />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 items-start">
            {filteredCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
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
