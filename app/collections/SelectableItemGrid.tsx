"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  type ItemSortOption,
  publicItemsInfiniteQueryOptions,
} from "@/app/items/actions";
import { myItemsInfiniteQueryOptions } from "@/app/my/items/hooks";
import { Card } from "@/app/ui/item/Card";
import { ItemFilterBar } from "@/app/ui/item/ItemFilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import type { Item, ItemRarityFilter } from "@/lib/services/items";
import { CreatorCombobox } from "./CreatorCombobox";

interface SelectableItemGridProps {
  selectedIds: Set<string>;
  onToggle: (item: Item) => void;
}

export function SelectableItemGrid({
  selectedIds,
  onToggle,
}: SelectableItemGridProps) {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [rawSearch, setRawSearch] = useState<string | null>(null);
  const [search] = useDebouncedValue(rawSearch, { wait: 250 });
  const [sort, setSort] = useState<ItemSortOption>("-createdAt");
  const [rarity, setRarity] = useState<ItemRarityFilter>("all");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const { data: session } = useSession();

  const params = {
    search: search ?? undefined,
    sort,
    rarity,
    sourceId: sourceId ?? undefined,
    limit: 12,
  };

  const isMyContent = creatorId !== null && creatorId === session?.user?.id;

  const publicQuery = useInfiniteQuery({
    ...publicItemsInfiniteQueryOptions({
      ...params,
      creatorId: creatorId ?? undefined,
    }),
    enabled: !isMyContent,
  });

  const myQuery = useInfiniteQuery({
    ...myItemsInfiniteQueryOptions(params),
    enabled: isMyContent,
  });

  const activeQuery = isMyContent ? myQuery : publicQuery;
  const { isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    activeQuery;
  const items = activeQuery.data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <ItemFilterBar
        searchTerm={search}
        sortOption={sort}
        rarityFilter={rarity}
        onSearch={setRawSearch}
        onSortChange={setSort}
        onRarityChange={setRarity}
        sourceId={sourceId}
        onSourceChange={setSourceId}
        beforeFilters={
          <CreatorCombobox
            kind="items"
            value={creatorId}
            onChange={setCreatorId}
          />
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !items || items.length === 0 ? (
        <EmptyState entityName="items" />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {items.map((item) => (
            <Card
              className="max-w-sm min-w-2xs"
              key={item.id}
              item={item}
              creator={item.creator}
              hideDescription={true}
              selectable
              selected={selectedIds.has(item.id)}
              onSelect={() => onToggle(item)}
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
