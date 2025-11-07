"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { publicMonstersInfiniteQueryOptions } from "@/app/monsters/hooks";
import { myMonstersInfiniteQueryOptions } from "@/app/my/monsters/hooks";
import { userProfileMonstersInfiniteQueryOptions } from "@/app/u/[username]/hooks";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import {
  MONSTER_ROLES,
  MonsterTypeOptions,
  PaginateMonstersSortOptions,
} from "@/lib/services/monsters/types";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { MonsterFilterBar } from "./MonsterFilterBar";

// we can't directly pass the queryOptions fn here because props to client
// components must be serializable.
export type PaginatedMonsterGridProps =
  | { kind: "monsters" | "my-monsters" }
  | {
      kind: "user-monsters";
      creatorId: string;
    };
export const PaginatedMonsterGrid: React.FC<PaginatedMonsterGridProps> = (
  props
) => {
  const [rawSearchQuery, setSearchQuery] = useQueryState("search");
  const [searchQuery] = useDebouncedValue(rawSearchQuery, { wait: 250 });

  const [sortQuery, setSortQuery] = useQueryState(
    "sort",
    parseAsStringLiteral(PaginateMonstersSortOptions).withDefault("-createdAt")
  );
  const [typeQuery, setTypeQuery] = useQueryState(
    "type",
    parseAsStringLiteral(MonsterTypeOptions).withDefault("all")
  );
  const [sourceIdQuery, setSourceIdQuery] = useQueryState(
    "sourceId",
    parseAsString
  );
  const [roleQuery, setRoleQuery] = useQueryState(
    "role",
    parseAsStringLiteral(MONSTER_ROLES.map((r) => r.value))
  );

  const params = {
    search: searchQuery ?? undefined,
    sort: sortQuery,
    type: typeQuery,
    sourceId: sourceIdQuery ?? undefined,
    role: roleQuery ?? undefined,
    limit: 12,
  };
  const queryParams = () => {
    switch (props.kind) {
      case "user-monsters":
        return userProfileMonstersInfiniteQueryOptions(props.creatorId, params);
      case "my-monsters":
        return myMonstersInfiniteQueryOptions(params);
      case "monsters":
        return publicMonstersInfiniteQueryOptions(params);
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

  const filteredMonsters = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <MonsterFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
        typeFilter={typeQuery}
        onTypeFilterChange={setTypeQuery}
        sourceId={sourceIdQuery}
        onSourceChange={setSourceIdQuery}
        role={roleQuery}
        onRoleChange={setRoleQuery}
      />

      {!filteredMonsters || filteredMonsters?.length === 0 ? (
        <EmptyState entityName="monsters" />
      ) : (
        <div className="flex flex-col md:grid md:grid-flow-dense md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMonsters.map((monster) => (
            <div
              key={monster.id}
              className={cn(
                monster.legendary && "sm:col-span-2 md:col-span-2",
                monster.legendary &&
                  typeQuery === "legendary" &&
                  "md:col-span-3"
              )}
            >
              <Card
                monster={monster}
                creator={monster.creator}
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
