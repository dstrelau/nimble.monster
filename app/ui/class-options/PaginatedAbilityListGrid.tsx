"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { publicClassAbilityListsInfiniteQueryOptions } from "@/app/class-options/hooks";
import { myClassAbilityListsInfiniteQueryOptions } from "@/app/my/class-options/hooks";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import { AbilityListCardMini } from "./AbilityListCardMini";
import { AbilityListFilterBar } from "./AbilityListFilterBar";

const PaginateClassAbilityListsSortOptions = [
  "-createdAt",
  "createdAt",
  "name",
  "-name",
] as const;

export type PaginatedAbilityListGridProps =
  | { kind: "class-ability-lists" | "my-class-ability-lists" }
  | {
      kind: "user-class-ability-lists";
      creatorId: string;
    };

export const PaginatedAbilityListGrid: React.FC<
  PaginatedAbilityListGridProps
> = (props) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState(
    "sort",
    parseAsStringLiteral(PaginateClassAbilityListsSortOptions).withDefault(
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
      case "user-class-ability-lists":
        throw new Error("Not implemented");
      case "my-class-ability-lists":
        return myClassAbilityListsInfiniteQueryOptions(params);
      case "class-ability-lists":
        return publicClassAbilityListsInfiniteQueryOptions(params);
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

  const filteredLists = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <AbilityListFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
      />

      {!filteredLists || filteredLists?.length === 0 ? (
        <EmptyState entityName="class options" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => (
            <div key={list.id} className="w-full max-w-sm mx-auto">
              <AbilityListCardMini abilityList={list} />
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
