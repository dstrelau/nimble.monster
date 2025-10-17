"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  MonsterTypeOptions,
  PaginateMonstersSortOptions,
} from "@/lib/services/monsters/types";
import { cn } from "@/lib/utils";
import { publicMonstersInfiniteQueryOptions } from "../monsters/hooks";
import { Card } from "./monster/Card";
import { SimpleFilterBar } from "./monster/SimpleFilterBar";

export const MonstersListView: React.FC = () => {
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

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(
      publicMonstersInfiniteQueryOptions({
        sort: sortQuery,
        search: searchQuery ?? undefined,
        type: typeQuery,
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

  const filteredMonsters = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <SimpleFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
        typeFilter={typeQuery}
        onTypeFilterChange={setTypeQuery}
      />

      {!filteredMonsters || filteredMonsters?.length === 0 ? (
        <div className="col-span-4 text-center text-muted-foreground">
          No monsters found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMonsters.map((monster) => (
            <div
              key={monster.id}
              className={cn(
                "w-full max-w-sm mx-auto",
                monster.legendary && "max-w-3xl sm:col-span-2 md:col-span-2",
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
