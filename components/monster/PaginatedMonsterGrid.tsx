"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import type React from "react";
import { publicHazardsInfiniteQueryOptions } from "@/app/hazards/hooks";
import { publicMonstersInfiniteQueryOptions } from "@/app/monsters/hooks";
import { myHazardsInfiniteQueryOptions } from "@/app/my/hazards/hooks";
import { myMonstersInfiniteQueryOptions } from "@/app/my/monsters/hooks";
import {
  userProfileHazardsInfiniteQueryOptions,
  userProfileMonstersInfiniteQueryOptions,
} from "@/app/u/[username]/hooks";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { LoadMoreButton } from "@/components/shared/LoadMoreButton";
import { toHazardMonsterView } from "@/lib/services/hazards";
import type { BestiaryEntry } from "@/lib/services/monsters/types";
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
  | {
      kind: "monsters" | "my-monsters";
      entityType?: "hazards" | "monsters";
    }
  | {
      kind: "user-monsters";
      creatorId: string;
      entityType?: "hazards" | "monsters";
    };
export const PaginatedMonsterGrid: React.FC<PaginatedMonsterGridProps> = (
  props
) => {
  const hazardsOnly = props.entityType === "hazards";
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
  const [sourceQuery, setSourceQuery] = useQueryState("source", parseAsString);
  const [roleQuery, setRoleQuery] = useQueryState(
    "role",
    parseAsStringLiteral(MONSTER_ROLES.map((r) => r.value))
  );
  const [levelQuery, setLevelQuery] = useQueryState("level", parseAsInteger);
  const creatureType = typeQuery === "hazard" ? "all" : typeQuery;
  const params = {
    search: searchQuery ?? undefined,
    sort: sortQuery,
    type: creatureType,
    source: sourceQuery ?? undefined,
    role: roleQuery ?? undefined,
    level: levelQuery ?? undefined,
    limit: 12,
  };
  const queryParams = () => {
    if (hazardsOnly) {
      const { type: _type, role: _role, ...hazardParams } = params;
      switch (props.kind) {
        case "user-monsters":
          return userProfileHazardsInfiniteQueryOptions(
            props.creatorId,
            hazardParams
          );
        case "my-monsters":
          return myHazardsInfiniteQueryOptions(hazardParams);
        case "monsters":
          return publicHazardsInfiniteQueryOptions(hazardParams);
      }
    }
    switch (props.kind) {
      case "user-monsters":
        return userProfileMonstersInfiniteQueryOptions(props.creatorId, params);
      case "my-monsters":
        return myMonstersInfiniteQueryOptions(params);
      case "monsters":
        return publicMonstersInfiniteQueryOptions(params);
    }
  };

  const options = queryParams();
  const normalizedOptions = {
    queryKey: options.queryKey,
    queryFn: async (context: {
      pageParam?: string;
    }): Promise<{ data: BestiaryEntry[]; nextCursor: string | null }> => {
      const page = await options.queryFn(context);
      return page;
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: {
      data: BestiaryEntry[];
      nextCursor: string | null;
    }) => last.nextCursor,
  };
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(normalizedOptions);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  const filteredMonsters = data?.pages.flatMap((page) => page.data);

  return (
    <div className="@container space-y-6">
      <MonsterFilterBar
        searchTerm={searchQuery}
        sortOption={sortQuery}
        onSearch={setSearchQuery}
        onSortChange={setSortQuery}
        typeFilter={typeQuery}
        onTypeFilterChange={setTypeQuery}
        source={sourceQuery}
        onSourceChange={setSourceQuery}
        role={roleQuery}
        onRoleChange={setRoleQuery}
        level={levelQuery}
        onLevelChange={setLevelQuery}
        hazardsOnly={hazardsOnly}
      />

      {!filteredMonsters || filteredMonsters?.length === 0 ? (
        <EmptyState entityName={hazardsOnly ? "hazards" : "monsters"} />
      ) : (
        <div className="grid grid-flow-dense grid-cols-1 gap-8 @min-[44rem]:grid-cols-2 @min-[70rem]:grid-cols-3 print:grid-cols-3">
          {filteredMonsters.map((monster) => (
            <div
              key={monster.id}
              className={cn(
                !monster.hazard &&
                  (monster.legendary || (monster.members?.length ?? 0) > 0) &&
                  "@min-[44rem]:col-span-2 print:col-span-2",
                !monster.hazard &&
                  monster.legendary &&
                  typeQuery === "legendary" &&
                  "@min-[70rem]:col-span-3"
              )}
            >
              <Card
                monster={
                  monster.hazard ? toHazardMonsterView(monster) : monster
                }
                creator={monster.creator}
                hideDescription={true}
              />
            </div>
          ))}
        </div>
      )}
      {hasNextPage && (
        <LoadMoreButton onClick={() => fetchNextPage()} disabled={isFetching} />
      )}
    </div>
  );
};
