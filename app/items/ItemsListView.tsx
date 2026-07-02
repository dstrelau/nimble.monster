"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import type React from "react";
import { Card } from "@/components/item/Card";
import { ItemFilterBar } from "@/components/item/ItemFilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { LoadMoreButton } from "@/components/shared/LoadMoreButton";
import type { ItemRarityFilter } from "@/lib/services/items";
import {
  type ItemSortOption,
  publicItemsInfiniteQueryOptions,
} from "./actions";

export const ItemsListView: React.FC = () => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState("sort", {
    defaultValue: "-createdAt",
  });
  const [rarityQuery, setRarityQuery] = useQueryState("rarity", {
    defaultValue: "all",
  });
  const [sourceQuery, setSourceQuery] = useQueryState("source", parseAsString);

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicItemsInfiniteQueryOptions({
        rarity: rarityQuery,
        sort: sortQuery,
        search: searchQuery || undefined,
        source: sourceQuery ?? undefined,
      })
    );

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const filteredItems = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <ItemFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery as ItemSortOption}
        rarityFilter={rarityQuery as ItemRarityFilter}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
        onRarityChange={setRarityQuery}
        source={sourceQuery}
        onSourceChange={setSourceQuery}
      />

      {!filteredItems || filteredItems?.length === 0 ? (
        <EmptyState entityName="items" />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {filteredItems.map((item) => (
              <Card
                className="max-w-sm min-w-2xs"
                key={item.id}
                item={item}
                creator={item.creator}
                hideDescription={true}
              />
            ))}
          </div>
          {data?.pages.at(-1)?.data.length === 12 && hasNextPage && (
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
