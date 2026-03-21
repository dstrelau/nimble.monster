/**
 * Base types that are used across the application.
 * These types should NOT import from service modules to avoid circular dependencies.
 */

export interface User {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  imageUrl?: string;
  bannerDismissed?: boolean;
}

export const UNKNOWN_USER: User = {
  id: "",
  discordId: "",
  username: "",
  displayName: "",
  imageUrl: "",
};

export interface Source {
  id: string;
  name: string;
  license: string;
  link: string;
  abbreviation: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Award {
  id: string;
  slug: string;
  name: string;
  abbreviation: string;
  description?: string | null;
  url: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
}

export interface Action {
  id: string;
  name: string;
  damage?: string;
  range?: string;
  description?: string;
}

export interface Condition {
  id: string;
  name: string;
  description: string;
  official: boolean;
}

export const FAMILY_VISIBILITY = [
  { value: "public", label: "Public" },
  { value: "secret", label: "Secret" },
  { value: "private", label: "Private" },
] as const;
export type FamilyVisibility = (typeof FAMILY_VISIBILITY)[number]["value"];

export interface FamilyOverview {
  id: string;
  name: string;
  description?: string;
  abilities: Ability[];
  visibility?: FamilyVisibility;
  monsterCount?: number;
  creatorId: string;
  creator: User;
}
