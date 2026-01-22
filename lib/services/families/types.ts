import type { Ability, User } from "@/lib/types";

export interface FamilyOverview {
  id: string;
  name: string;
  description?: string;
  abilities: Ability[];
  visibility: "public" | "secret" | "private" | null;
  creatorId: string | null;
  creator: User;
  monsterCount?: number;
}
