import { z } from "zod";

import { defineRoute } from "@/lib/contract";
import type { PaginateHazardsResponse } from "@/lib/services/hazards";
import type { PaginatePublicItemsResponse } from "@/lib/services/items/service";
import {
  type ItemRarityFilter,
  type PaginateItemsSortOption,
  PaginateItemsSortOptions,
} from "@/lib/services/items/types";
import type { PaginatePublicMonstersResponse } from "@/lib/services/monsters/service";
import {
  type CreatureTypeOption,
  CreatureTypeOptions,
  type MonsterRole,
  MonsterRoleOptions,
  type PaginateMonstersSortOption,
  PaginateMonstersSortOptions,
} from "@/lib/services/monsters/types";

export type PickerSearchScope = "public" | "mine";

export interface PickerMonstersSearchInput {
  kind: "monsters";
  scope: PickerSearchScope;
  search?: string;
  sort: PaginateMonstersSortOption;
  type: CreatureTypeOption;
  source?: string;
  role?: MonsterRole;
  level?: number;
  creatorId?: string;
  limit: number;
  cursor?: string;
}

export interface PickerHazardsSearchInput {
  kind: "hazards";
  scope: PickerSearchScope;
  search?: string;
  sort: PaginateMonstersSortOption;
  source?: string;
  level?: number;
  creatorId?: string;
  limit: number;
  cursor?: string;
}

export interface PickerItemsSearchInput {
  kind: "items";
  scope: PickerSearchScope;
  search?: string;
  sort: PaginateItemsSortOption;
  rarity: ItemRarityFilter;
  source?: string;
  creatorId?: string;
  limit: number;
  cursor?: string;
}

export type StatblockPickerSearchInput =
  | PickerMonstersSearchInput
  | PickerHazardsSearchInput
  | PickerItemsSearchInput;

/** JSON's representation of a domain value returned by the picker route. */
export type Jsonify<T> = T extends Date
  ? string
  : T extends readonly (infer U)[]
    ? Jsonify<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : T;

export type StatblockPickerSearchResponse =
  | ({ kind: "monsters" } & PaginatePublicMonstersResponse)
  | ({ kind: "hazards" } & PaginateHazardsResponse)
  | ({ kind: "items" } & PaginatePublicItemsResponse);

export type StatblockPickerSearchWireResponse =
  Jsonify<StatblockPickerSearchResponse>;

const scopeSchema = z.enum(["public", "mine"]);
const commonSearchSchema = {
  scope: scopeSchema,
  search: z.string().optional(),
  source: z.string().optional(),
  creatorId: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(12),
  cursor: z.string().optional(),
};

export const statblockPickerSearchSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("monsters"),
    ...commonSearchSchema,
    sort: z.enum(PaginateMonstersSortOptions).default("-createdAt"),
    type: z.enum(CreatureTypeOptions).default("all"),
    role: z.enum(MonsterRoleOptions).optional(),
    level: z.number().int().optional(),
  }),
  z.object({
    kind: z.literal("hazards"),
    ...commonSearchSchema,
    sort: z.enum(PaginateMonstersSortOptions).default("-createdAt"),
    level: z.number().int().optional(),
  }),
  z.object({
    kind: z.literal("items"),
    ...commonSearchSchema,
    sort: z.enum(PaginateItemsSortOptions).default("-createdAt"),
    rarity: z
      .enum([
        "all",
        "unspecified",
        "common",
        "uncommon",
        "rare",
        "very_rare",
        "legendary",
      ])
      .default("all"),
  }),
]);

export const statblockPickerSearch = defineRoute<
  StatblockPickerSearchInput,
  StatblockPickerSearchWireResponse
>({
  method: "POST",
  path: () => "/_actions/statblockPickerSearch",
});

export type { CreatureTypeOption, MonsterRole };
