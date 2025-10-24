"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { publicBackgroundsInfiniteQueryOptions } from "@/app/backgrounds/hooks";
import { myBackgroundsInfiniteQueryOptions } from "@/app/my/backgrounds/hooks";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import { BackgroundFilterBar } from "./BackgroundFilterBar";
import { Card } from "./Card";

const PaginateBackgroundsSortOptions = [
  "-createdAt",
  "createdAt",
  "name",
  "-name",
] as const;

export type PaginatedBackgroundGridProps =
  | { kind: "backgrounds" | "my-backgrounds" }
  | {
      kind: "user-backgrounds";
      creatorId: string;
    };

export const PaginatedBackgroundGrid: React.FC<PaginatedBackgroundGridProps> = (
  props
) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState(
    "sort",
    parseAsStringLiteral(PaginateBackgroundsSortOptions).withDefault(
      "-createdAt"
    )
  );

  const params = {
    search: searchQuery ?? undefined,
    sort: sortQuery,
    limit: 12,
  };

  const queryParams = () => {
    switch (props.kind) {
      case "user-backgrounds":
        throw new Error("Not implemented");
      case "my-backgrounds":
        return myBackgroundsInfiniteQueryOptions(params);
      case "backgrounds":
        return publicBackgroundsInfiniteQueryOptions(params);
    }
  };

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(queryParams());

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const filteredBackgrounds = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <BackgroundFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
      />

      {!filteredBackgrounds || filteredBackgrounds?.length === 0 ? (
        <EmptyState entityName="backgrounds" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBackgrounds.map((background) => (
            <div key={background.id} className="w-full max-w-sm mx-auto">
              <Card background={background} creator={background.creator} />
            </div>
          ))}
        </div>
      )}
      {data?.pages.at(-1)?.data.length === 12 && hasNextPage && (
        <LoadMoreButton onClick={() => fetchNextPage()} disabled={isFetching} />
      )}
    </div>
  );
};
