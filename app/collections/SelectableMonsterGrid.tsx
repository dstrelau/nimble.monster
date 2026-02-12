"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { publicMonstersInfiniteQueryOptions } from "@/app/monsters/hooks";
import { myMonstersInfiniteQueryOptions } from "@/app/my/monsters/hooks";
import { Card } from "@/app/ui/monster/Card";
import { MonsterFilterBar } from "@/app/ui/monster/MonsterFilterBar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/app/ui/shared/GridStates";
import { LoadMoreButton } from "@/app/ui/shared/LoadMoreButton";
import type { Monster } from "@/lib/services/monsters";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import { cn } from "@/lib/utils";
import { CreatorCombobox } from "./CreatorCombobox";

interface SelectableMonsterGridProps {
  selectedIds: Set<string>;
  onToggle: (monster: Monster) => void;
}

export function SelectableMonsterGrid({
  selectedIds,
  onToggle,
}: SelectableMonsterGridProps) {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [rawSearch, setRawSearch] = useState<string | null>(null);
  const [search] = useDebouncedValue(rawSearch, { wait: 250 });
  const [sort, setSort] = useState<PaginateMonstersSortOption>("-createdAt");
  const [type, setType] = useState<MonsterTypeOption>("all");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [role, setRole] = useState<MonsterRole | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const { data: session } = useSession();

  const params = {
    search: search ?? undefined,
    sort,
    type,
    sourceId: sourceId ?? undefined,
    role: role ?? undefined,
    level: level ?? undefined,
    limit: 12,
  };

  const isMyContent = creatorId !== null && creatorId === session?.user?.id;
  const queryOptions = isMyContent
    ? myMonstersInfiniteQueryOptions(params)
    : publicMonstersInfiniteQueryOptions({
        ...params,
        creatorId: creatorId ?? undefined,
      });

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage, error } =
    useInfiniteQuery(queryOptions);

  const monsters = data?.pages.flatMap((page) => page.data);

  return (
    <div className="space-y-6">
      <MonsterFilterBar
        searchTerm={search}
        sortOption={sort}
        onSearch={setRawSearch}
        onSortChange={setSort}
        typeFilter={type}
        onTypeFilterChange={setType}
        sourceId={sourceId}
        onSourceChange={setSourceId}
        role={role}
        onRoleChange={setRole}
        level={level}
        onLevelChange={setLevel}
        beforeFilters={
          <CreatorCombobox
            kind="monsters"
            value={creatorId}
            onChange={setCreatorId}
          />
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : !monsters || monsters.length === 0 ? (
        <EmptyState entityName="monsters" />
      ) : (
        <div className="flex flex-col md:grid md:grid-flow-dense md:grid-cols-2 gap-8">
          {monsters.map((monster) => (
            <div
              key={monster.id}
              className={cn(monster.legendary && "sm:col-span-2 md:col-span-2")}
            >
              <Card
                monster={monster}
                creator={monster.creator}
                hideDescription={true}
                selectable
                selected={selectedIds.has(monster.id)}
                onSelect={() => onToggle(monster)}
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
}
