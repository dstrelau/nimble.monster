"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type React from "react";
import { useEffect, useRef } from "react";
import {
  type CollectionSortOption,
  publicCollectionsInfiniteQueryOptions,
} from "@/app/collections/actions";
import { CollectionCard } from "@/components/collection/CollectionCard";
import { CollectionPlateCard } from "@/components/collection/CollectionPlateCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { LoadMoreButton } from "@/components/shared/LoadMoreButton";
import { CollectionFilterBar } from "./CollectionFilterBar";

interface CollectionsListViewProps {
  featuredCollection?: string;
  cardVariant?: "default" | "plate";
  limit?: number;
  // Shown below the grid once every page has loaded.
  endMessage?: React.ReactNode;
}

export const CollectionsListView: React.FC<CollectionsListViewProps> = ({
  featuredCollection,
  cardVariant = "default",
  limit,
  endMessage,
}) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState("sort", {
    defaultValue: "-createdAt",
  });

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicCollectionsInfiniteQueryOptions({
        sort: featuredCollection ? "-createdAt" : sortQuery,
        search: featuredCollection ? undefined : searchQuery || undefined,
        featuredCollection,
        limit,
      })
    );

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!featuredCollection || !sentinel || !hasNextPage || isFetching) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { rootMargin: "800px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [featuredCollection, hasNextPage, isFetching, fetchNextPage]);

  const filteredCollections = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      {!featuredCollection && (
        <CollectionFilterBar
          searchTerm={searchQuery}
          sortOption={sortQuery as CollectionSortOption}
          onSearch={setSearchQuery}
          onSortChange={setSortQuery}
        />
      )}

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !filteredCollections || filteredCollections?.length === 0 ? (
        <EmptyState entityName="collections" />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 items-start">
            {filteredCollections.map((collection) =>
              cardVariant === "plate" ? (
                <CollectionPlateCard
                  key={collection.id}
                  collection={collection}
                />
              ) : (
                <CollectionCard key={collection.id} collection={collection} />
              )
            )}
          </div>
          {hasNextPage ? (
            <div ref={loadMoreRef}>
              <LoadMoreButton
                onClick={() => fetchNextPage()}
                disabled={isFetching}
              />
            </div>
          ) : (
            endMessage
          )}
        </>
      )}
    </div>
  );
};
