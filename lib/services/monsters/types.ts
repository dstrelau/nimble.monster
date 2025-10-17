import type {
  Ability,
  Action,
  FamilyOverview,
  Source,
  User,
} from "@/lib/types";

export const SIZES = [
  { value: "tiny", label: "Tiny" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "huge", label: "Huge" },
  { value: "gargantuan", label: "Gargantuan" },
] as const;
export type MonsterSize = (typeof SIZES)[number]["value"];

export const MONSTER_LEVELS = [
  { value: -4, label: "1/4", display: "1/4" },
  { value: -3, label: "1/3", display: "1/3" },
  { value: -2, label: "1/2", display: "1/2" },
  { value: 1, label: "1", display: "1" },
  { value: 2, label: "2", display: "2" },
  { value: 3, label: "3", display: "3" },
  { value: 4, label: "4", display: "4" },
  { value: 5, label: "5", display: "5" },
  { value: 6, label: "6", display: "6" },
  { value: 7, label: "7", display: "7" },
  { value: 8, label: "8", display: "8" },
  { value: 9, label: "9", display: "9" },
  { value: 10, label: "10", display: "10" },
  { value: 11, label: "11", display: "11" },
  { value: 12, label: "12", display: "12" },
  { value: 13, label: "13", display: "13" },
  { value: 14, label: "14", display: "14" },
  { value: 15, label: "15", display: "15" },
  { value: 16, label: "16", display: "16" },
  { value: 17, label: "17", display: "17" },
  { value: 18, label: "18", display: "18" },
  { value: 19, label: "19", display: "19" },
  { value: 20, label: "20", display: "20" },
] as const;

export const LEGENDARY_MONSTER_LEVELS = MONSTER_LEVELS.filter(
  (level) => level.value > 0
);
export const ALL_MONSTER_LEVELS = MONSTER_LEVELS;

export const ARMORS = [
  { value: "none", label: "None" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
] as const;
export type MonsterArmor = (typeof ARMORS)[number]["value"];

export type TypeFilter = "all" | "legendary" | "standard" | "minion";

export interface MonsterMini {
  id: string;
  hp: number;
  kind?: string;
  legendary: boolean;
  minion: boolean;
  level: string;
  levelInt: number;
  name: string;
  size: MonsterSize;
  armor: MonsterArmor;
  visibility: "public" | "private";
  createdAt: Date;
}

export interface Monster extends MonsterMini {
  saves?: string;
  bloodied?: string;
  lastStand?: string;
  speed: number;
  fly: number;
  swim: number;
  climb: number;
  teleport: number;
  burrow: number;
  size: MonsterSize;
  abilities: Ability[];
  actions: Action[];
  actionPreface: string;
  moreInfo?: string;
  families: FamilyOverview[];
  creator: User;
  source?: Source;
  updatedAt: Date;
  imageUrl?: string;
}

export interface SearchMonstersParams {
  searchTerm?: string;
  type?: TypeFilter;
  creatorId?: string;
  legendary?: boolean | null;
  sortBy?: "name" | "level" | "hp";
  sortDirection?: "asc" | "desc";
  limit?: number;
}

export const MonsterTypeOptions = [
  "all",
  "standard",
  "legendary",
  "minion",
] as const;
export type MonsterTypeOption = (typeof MonsterTypeOptions)[number];

export const PaginateMonstersSortOptions = [
  "createdAt",
  "-createdAt",
  "level",
  "-level",
  "name",
  "-name",
] as const;
export type PaginateMonstersSortOption =
  (typeof PaginateMonstersSortOptions)[number];

export interface PaginateMonstersParams {
  search?: string;
  cursor?: string;
  limit?: number;
  sort?: PaginateMonstersSortOption;
  type?: MonsterTypeOption;
}

export interface CreateMonsterInput {
  name: string;
  kind?: string;
  level: string;
  levelInt: number;
  hp: number;
  armor: MonsterArmor | "";
  size: MonsterSize;
  speed: number;
  fly: number;
  swim: number;
  climb: number;
  burrow: number;
  teleport: number;
  families?: { id: string }[];
  actions: Action[];
  abilities: Ability[];
  actionPreface: string;
  moreInfo?: string;
  visibility: "public" | "private";
  legendary?: boolean;
  minion?: boolean;
  bloodied?: string;
  lastStand?: string;
  saves?: string[];
  sourceId?: string;
}

export interface UpdateMonsterInput {
  id: string;
  name: string;
  level: string;
  levelInt: number;
  hp: number;
  armor: MonsterArmor;
  size: MonsterSize;
  speed: number;
  fly?: number;
  swim?: number;
  climb?: number;
  teleport?: number;
  burrow?: number;
  actions: Action[];
  abilities: Ability[];
  legendary: boolean;
  minion: boolean;
  bloodied: string;
  lastStand: string;
  saves: string[];
  kind: string;
  visibility: "public" | "private";
  actionPreface: string;
  moreInfo: string;
  families?: { id: string }[];
  sourceId?: string | null;
}
