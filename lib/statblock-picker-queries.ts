import { keepPreviousData } from "@tanstack/react-query";
import { call } from "@/lib/contract";
import {
  type Jsonify,
  type PickerHazardsSearchInput,
  type PickerItemsSearchInput,
  type PickerMonstersSearchInput,
  type StatblockPickerSearchResponse,
  type StatblockPickerSearchWireResponse,
  statblockPickerSearch,
} from "@/lib/contracts/statblock-picker";
import type {
  Item,
  ItemRarityFilter,
  PaginateItemsSortOption,
} from "@/lib/services/items/types";
import type {
  Hazard,
  Monster,
  MonsterRole,
  MonsterTypeOption,
  PaginateMonstersSortOption,
} from "@/lib/services/monsters/types";
import type { Award, Source } from "@/lib/types";

type PickerMonstersWirePage = Extract<
  StatblockPickerSearchWireResponse,
  { kind: "monsters" }
>;
type PickerHazardsWirePage = Extract<
  StatblockPickerSearchWireResponse,
  { kind: "hazards" }
>;
type PickerItemsWirePage = Extract<
  StatblockPickerSearchWireResponse,
  { kind: "items" }
>;
type PickerMonstersPage = Extract<
  StatblockPickerSearchResponse,
  { kind: "monsters" }
>;
type PickerHazardsPage = Extract<
  StatblockPickerSearchResponse,
  { kind: "hazards" }
>;
type PickerItemsPage = Extract<
  StatblockPickerSearchResponse,
  { kind: "items" }
>;

interface PickerMonsterQueryParams {
  search?: string;
  sort?: PaginateMonstersSortOption;
  type?: MonsterTypeOption;
  source?: string;
  role?: MonsterRole;
  level?: number;
  creatorId?: string;
  limit?: number;
}

interface PickerHazardQueryParams {
  search?: string;
  sort?: PaginateMonstersSortOption;
  source?: string;
  level?: number;
  creatorId?: string;
  limit?: number;
}

interface PickerItemQueryParams {
  search?: string | null;
  sort?: PaginateItemsSortOption;
  rarity?: ItemRarityFilter;
  source?: string;
  creatorId?: string;
  limit?: number;
}

interface PickerMineQueryParams {
  /** Used only in the React Query key; the route authenticates ownership. */
  ownerId?: string;
}

function reviveSource(source: Jsonify<Source> | undefined): Source | undefined {
  if (!source) return undefined;

  return {
    ...source,
    createdAt: new Date(source.createdAt),
    updatedAt: new Date(source.updatedAt),
  };
}

function reviveAward(award: Jsonify<Award>): Award {
  return {
    ...award,
    createdAt: new Date(award.createdAt),
    updatedAt: new Date(award.updatedAt),
  };
}

function reviveAwards(
  awards: Jsonify<Award>[] | undefined
): Award[] | undefined {
  return awards?.map(reviveAward);
}

function reviveMonster(monster: Jsonify<Monster>): Monster {
  return {
    ...monster,
    createdAt: new Date(monster.createdAt),
    updatedAt: new Date(monster.updatedAt),
    source: reviveSource(monster.source),
    awards: reviveAwards(monster.awards),
  };
}

function reviveHazard(hazard: Jsonify<Hazard>): Hazard {
  return {
    ...hazard,
    createdAt: new Date(hazard.createdAt),
    updatedAt: new Date(hazard.updatedAt),
    source: reviveSource(hazard.source),
    awards: reviveAwards(hazard.awards),
  };
}

function reviveItem(item: Jsonify<Item>): Item {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    source: reviveSource(item.source),
    awards: reviveAwards(item.awards),
  };
}

function reviveMonstersPage(page: PickerMonstersWirePage): PickerMonstersPage {
  return { ...page, data: page.data.map(reviveMonster) };
}

function reviveHazardsPage(page: PickerHazardsWirePage): PickerHazardsPage {
  return { ...page, data: page.data.map(reviveHazard) };
}

function reviveItemsPage(page: PickerItemsWirePage): PickerItemsPage {
  return { ...page, data: page.data.map(reviveItem) };
}

export function pickerPublicMonstersInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  type = "all",
  source,
  role,
  level,
  creatorId,
  limit = 12,
}: PickerMonsterQueryParams = {}) {
  const creatureType = type === "hazard" ? "all" : type;
  const params = {
    search,
    sort,
    type: creatureType,
    source,
    role,
    level,
    creatorId,
    limit,
  };
  return {
    queryKey: ["statblock-picker-monsters", "public", params],
    queryFn: async ({ pageParam: cursor }: { pageParam?: string }) => {
      const input: PickerMonstersSearchInput = {
        kind: "monsters",
        scope: "public",
        ...params,
        cursor,
      };
      const response = await call(statblockPickerSearch, input);
      if (response.kind !== "monsters") {
        throw new Error("Unexpected statblock picker response");
      }
      return reviveMonstersPage(response);
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PickerMonstersPage) => last.nextCursor,
  };
}

export function pickerMyMonstersInfiniteQueryOptions({
  ownerId,
  search,
  sort = "-createdAt",
  type = "all",
  source,
  role,
  level,
  limit = 12,
}: Omit<PickerMonsterQueryParams, "creatorId"> & PickerMineQueryParams = {}) {
  const creatureType = type === "hazard" ? "all" : type;
  const params = {
    search,
    sort,
    type: creatureType,
    source,
    role,
    level,
    limit,
  };
  return {
    queryKey: ["statblock-picker-monsters", "mine", ownerId, params],
    queryFn: async ({ pageParam: cursor }: { pageParam?: string }) => {
      const input: PickerMonstersSearchInput = {
        kind: "monsters",
        scope: "mine",
        ...params,
        cursor,
      };
      const response = await call(statblockPickerSearch, input);
      if (response.kind !== "monsters") {
        throw new Error("Unexpected statblock picker response");
      }
      return reviveMonstersPage(response);
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PickerMonstersPage) => last.nextCursor,
  };
}

export function pickerPublicHazardsInfiniteQueryOptions({
  search,
  sort = "-createdAt",
  source,
  level,
  creatorId,
  limit = 12,
}: PickerHazardQueryParams = {}) {
  const params = { search, sort, source, level, creatorId, limit };
  return {
    queryKey: ["statblock-picker-hazards", "public", params],
    queryFn: async ({ pageParam: cursor }: { pageParam?: string }) => {
      const input: PickerHazardsSearchInput = {
        kind: "hazards",
        scope: "public",
        ...params,
        cursor,
      };
      const response = await call(statblockPickerSearch, input);
      if (response.kind !== "hazards") {
        throw new Error("Unexpected statblock picker response");
      }
      return reviveHazardsPage(response);
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PickerHazardsPage) => last.nextCursor,
  };
}

export function pickerMyHazardsInfiniteQueryOptions({
  ownerId,
  search,
  sort = "-createdAt",
  source,
  level,
  limit = 12,
}: Omit<PickerHazardQueryParams, "creatorId"> & PickerMineQueryParams = {}) {
  const params = { search, sort, source, level, limit };
  return {
    queryKey: ["statblock-picker-hazards", "mine", ownerId, params],
    queryFn: async ({ pageParam: cursor }: { pageParam?: string }) => {
      const input: PickerHazardsSearchInput = {
        kind: "hazards",
        scope: "mine",
        ...params,
        cursor,
      };
      const response = await call(statblockPickerSearch, input);
      if (response.kind !== "hazards") {
        throw new Error("Unexpected statblock picker response");
      }
      return reviveHazardsPage(response);
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PickerHazardsPage) => last.nextCursor,
  };
}

export function pickerPublicItemsInfiniteQueryOptions({
  search = null,
  sort = "-createdAt",
  rarity = "all",
  source,
  creatorId,
  limit = 12,
}: PickerItemQueryParams = {}) {
  const params = {
    search: search ?? undefined,
    sort,
    rarity,
    source,
    creatorId,
    limit,
  };
  return {
    queryKey: ["statblock-picker-items", "public", params],
    queryFn: async ({ pageParam: cursor }: { pageParam?: string }) => {
      const input: PickerItemsSearchInput = {
        kind: "items",
        scope: "public",
        ...params,
        cursor,
      };
      const response = await call(statblockPickerSearch, input);
      if (response.kind !== "items") {
        throw new Error("Unexpected statblock picker response");
      }
      return reviveItemsPage(response);
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PickerItemsPage) => last.nextCursor ?? undefined,
  };
}

export function pickerMyItemsInfiniteQueryOptions({
  ownerId,
  search,
  sort = "-createdAt",
  rarity = "all",
  source,
  limit = 12,
}: Omit<PickerItemQueryParams, "creatorId"> & PickerMineQueryParams = {}) {
  const params = {
    search: search ?? undefined,
    sort,
    rarity,
    source,
    limit,
  };
  return {
    queryKey: ["statblock-picker-items", "mine", ownerId, params],
    queryFn: async ({ pageParam: cursor }: { pageParam?: string }) => {
      const input: PickerItemsSearchInput = {
        kind: "items",
        scope: "mine",
        ...params,
        cursor,
      };
      const response = await call(statblockPickerSearch, input);
      if (response.kind !== "items") {
        throw new Error("Unexpected statblock picker response");
      }
      return reviveItemsPage(response);
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined,
    getNextPageParam: (last: PickerItemsPage) => last.nextCursor ?? undefined,
  };
}
