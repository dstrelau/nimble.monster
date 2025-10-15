"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import type React from "react";
import { Button } from "@/components/ui/button";
import type { ItemRarityFilter } from "@/lib/services/items";
import { Card } from "../ui/item/Card";
import { ItemFilterBar } from "../ui/item/ItemFilterBar";
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
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicItemsInfiniteQueryOptions({
        rarity: rarityQuery,
        sort: sortQuery,
        search: searchQuery || undefined,
      })
    );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
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
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
        {!filteredItems || filteredItems?.length === 0 ? (
          <div className="col-span-4 text-center text-muted-foreground">
            No items found.
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              item={item}
              creator={item.creator}
              hideDescription={true}
            />
          ))
        )}
        {data?.pages.at(-1)?.data.length === 12 && hasNextPage && (
          <Button
            className="col-span-4 mx-auto min-w-2xs"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
          >
            Load More
          </Button>
        )}
      </div>
    </div>
  );
};
