"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Crown, PersonStanding } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { publicMonstersInfiniteQueryOptions } from "@/app/monsters/hooks";
import { myMonstersInfiniteQueryOptions } from "@/app/my/monsters/hooks";
import { Card } from "@/components/monster/Card";
import { MonsterFilterBar } from "@/components/monster/MonsterFilterBar";
import { PaperforgeImage } from "@/components/paperforge/PaperforgeImage";
import { CreatorCombobox } from "@/components/shared/CreatorCombobox";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/GridStates";
import { Level } from "@/components/shared/Level";
import { LoadMoreButton } from "@/components/shared/LoadMoreButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Monster } from "@/lib/services/monsters";
import type {
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import { cn } from "@/lib/utils";
import { formatSizeKind } from "@/lib/utils/monster";

interface SelectableMonsterGridProps {
  selectedIds: Set<string>;
  onToggle: (monster: Monster) => void;
  /** Render a dense single-column list instead of full monster cards, for narrow spaces like a sidebar. */
  compact?: boolean;
}

function CompactMonsterOption({
  monster,
  selected,
  onSelect,
}: {
  monster: Monster;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted",
        selected && "bg-accent ring-1 ring-amber-500"
      )}
    >
      <div className="flex w-6 shrink-0 items-center justify-center">
        {monster.paperforgeId ? (
          <PaperforgeImage
            id={monster.paperforgeId}
            size={24}
            className="rounded-sm"
          />
        ) : monster.legendary ? (
          <Crown className="size-4 stroke-flame" />
        ) : monster.minion ? (
          <PersonStanding className="size-4 stroke-flame" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-slab font-medium text-sm small-caps italic">
          {monster.name}
        </div>
        <div className="truncate text-muted-foreground text-xs">
          {monster.levelInt !== 0 && (
            <>
              Lvl <Level level={monster.level} />{" "}
            </>
          )}
          {formatSizeKind(monster)}
        </div>
      </div>
    </button>
  );
}

export function SelectableMonsterGrid({
  selectedIds,
  onToggle,
  compact = false,
}: SelectableMonsterGridProps) {
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [rawSearch, setRawSearch] = useState<string | null>(null);
  const [search] = useDebouncedValue(rawSearch, { wait: 250 });
  const [sort, setSort] = useState<PaginateMonstersSortOption>("-createdAt");
  const [type, setType] = useState<MonsterTypeOption>("all");
  const [source, setSourceId] = useState<string | null>(null);
  const [role, setRole] = useState<MonsterRole | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const { data: session } = useSession();

  const params = {
    search: search ?? undefined,
    sort,
    type,
    source: source ?? undefined,
    role: role ?? undefined,
    level: level ?? undefined,
    limit: compact ? 50 : 12,
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

  const results = isLoading ? (
    <LoadingState />
  ) : error ? (
    <ErrorState message={error.message} />
  ) : !monsters || monsters.length === 0 ? (
    <EmptyState entityName="monsters" />
  ) : compact ? (
    <div className="flex flex-col gap-1">
      {monsters.map((monster) => (
        <CompactMonsterOption
          key={monster.id}
          monster={monster}
          selected={selectedIds.has(monster.id)}
          onSelect={() => onToggle(monster)}
        />
      ))}
    </div>
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
  );

  const loadMore = hasNextPage && (
    <LoadMoreButton onClick={() => fetchNextPage()} disabled={isFetching} />
  );

  return (
    <div className={cn(compact ? "flex flex-col gap-3" : "space-y-6")}>
      <MonsterFilterBar
        searchTerm={search}
        sortOption={sort}
        onSearch={setRawSearch}
        onSortChange={setSort}
        typeFilter={type}
        onTypeFilterChange={setType}
        source={source}
        onSourceChange={setSourceId}
        role={role}
        onRoleChange={setRole}
        level={level}
        onLevelChange={setLevel}
        compact={compact}
        beforeFilters={
          <CreatorCombobox
            kind="monsters"
            value={creatorId}
            onChange={setCreatorId}
          />
        }
      />

      {compact ? (
        <ScrollArea className="h-[28rem] pr-2">
          {results}
          {loadMore && <div className="mt-2">{loadMore}</div>}
        </ScrollArea>
      ) : (
        <>
          {results}
          {loadMore}
        </>
      )}
    </div>
  );
}
