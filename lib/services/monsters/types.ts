import type {
  Ability,
  Action,
  Award,
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
  { value: -4, label: "1/4" },
  { value: -3, label: "1/3" },
  { value: -2, label: "1/2" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
  { value: 7, label: "7" },
  { value: 8, label: "8" },
  { value: 9, label: "9" },
  { value: 10, label: "10" },
  { value: 11, label: "11" },
  { value: 12, label: "12" },
  { value: 13, label: "13" },
  { value: 14, label: "14" },
  { value: 15, label: "15" },
  { value: 16, label: "16" },
  { value: 17, label: "17" },
  { value: 18, label: "18" },
  { value: 19, label: "19" },
  { value: 20, label: "20" },
  { value: 21, label: "21" },
  { value: 22, label: "22" },
  { value: 23, label: "23" },
  { value: 24, label: "24" },
  { value: 25, label: "25" },
  { value: 26, label: "26" },
  { value: 27, label: "27" },
  { value: 28, label: "28" },
  { value: 29, label: "29" },
  { value: 30, label: "30+" },
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

export const MONSTER_ROLES = [
  { value: "ambusher", label: "Ambusher" },
  { value: "aoe", label: "AoE" },
  { value: "controller", label: "Controller" },
  { value: "defender", label: "Defender" },
  { value: "melee", label: "Melee" },
  { value: "ranged", label: "Ranged" },
  { value: "skirmisher", label: "Skirmisher" },
  { value: "striker", label: "Striker" },
  { value: "summoner", label: "Summoner" },
  { value: "support", label: "Support" },
] as const;
export type MonsterRole = (typeof MONSTER_ROLES)[number]["value"];

export const MonsterRoleOptions = [
  "ambusher",
  "aoe",
  "controller",
  "defender",
  "melee",
  "ranged",
  "skirmisher",
  "striker",
  "summoner",
  "support",
] as const;

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
  paperforgeId?: string;
  createdAt: Date;
  role?: MonsterRole | null;
  isOfficial?: boolean;
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
  awards?: Award[];
  updatedAt: Date;
  imageUrl?: string;
  remixedFromId?: string | null;
  remixedFrom?: { id: string; name: string; creator: User } | null;
  isOfficial?: boolean;
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
  role?: MonsterRole | null;
  paperforgeId?: string | null;
  remixedFromId?: string;
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
  role?: MonsterRole | null;
  paperforgeId?: string | null;
}
