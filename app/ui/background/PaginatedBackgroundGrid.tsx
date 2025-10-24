"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { publicBackgroundsInfiniteQueryOptions } from "@/app/backgrounds/hooks";
import { myBackgroundsInfiniteQueryOptions } from "@/app/my/backgrounds/hooks";
import { Button } from "@/components/ui/button";
import { Card } from "./Card";
import { FilterBar } from "./FilterBar";

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

  const filteredBackgrounds = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <FilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
      />

      {!filteredBackgrounds || filteredBackgrounds?.length === 0 ? (
        <div className="col-span-4 text-center text-muted-foreground">
          No backgrounds found.
        </div>
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
        <div className="flex justify-center">
          <Button
            className="min-w-2xs"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};
