"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { publicAncestriesInfiniteQueryOptions } from "@/app/ancestries/hooks";
import { myAncestriesInfiniteQueryOptions } from "@/app/my/ancestries/hooks";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import { AncestryFilterBar } from "./AncestryFilterBar";
import { Card } from "./Card";

const PaginateAncestriesSortOptions = [
  "-createdAt",
  "createdAt",
  "name",
  "-name",
] as const;

export type PaginatedAncestryGridProps =
  | { kind: "ancestries" | "my-ancestries" }
  | {
      kind: "user-ancestries";
      creatorId: string;
    };

export const PaginatedAncestryGrid: React.FC<PaginatedAncestryGridProps> = (
  props
) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState(
    "sort",
    parseAsStringLiteral(PaginateAncestriesSortOptions).withDefault(
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
      case "user-ancestries":
        throw new Error("Not implemented");
      case "my-ancestries":
        return myAncestriesInfiniteQueryOptions(params);
      case "ancestries":
        return publicAncestriesInfiniteQueryOptions(params);
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

  const filteredAncestries = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <AncestryFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
      />

      {!filteredAncestries || filteredAncestries?.length === 0 ? (
        <EmptyState entityName="ancestries" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAncestries.map((ancestry) => (
            <div key={ancestry.id} className="w-full max-w-sm mx-auto">
              <Card
                ancestry={ancestry}
                creator={ancestry.creator}
                hideDescription={true}
              />
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
