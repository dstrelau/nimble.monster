import type { Ability, FamilyOverview, User } from "@/lib/types/base";

// Generic type for user row
export interface ConverterUserRow {
  id: string;
  discordId: string | null;
  username: string | null;
  displayName: string | null;
  imageUrl: string | null;
  avatar: string | null;
}

// Generic type for family with creator
interface FamilyWithCreator {
  id: string;
  name: string;
  description: string | null;
  abilities: unknown;
  visibility: string | null;
  creatorId: string;
  creator: ConverterUserRow;
}

export const parseJsonField = <T>(value: unknown): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
};

export const toUser = (u: ConverterUserRow): User => ({
  id: u.id,
  discordId: u.discordId ?? "",
  username: u.username ?? "",
  displayName: u.displayName || u.username || "",
  imageUrl:
    u.imageUrl ||
    (u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png"),
});

export const toFamilyOverview = (
  f: FamilyWithCreator | null
): FamilyOverview | undefined => {
  if (!f) {
    return undefined;
  }
  return {
    id: f.id,
    name: f.name,
    description: f.description ?? undefined,
    abilities: parseJsonField<Omit<Ability, "id">>(f.abilities).map(
      (ability) => ({
        ...ability,
        id: crypto.randomUUID(),
      })
    ),
    visibility: f.visibility as FamilyOverview["visibility"],
    creatorId: f.creatorId,
    creator: toUser(f.creator),
  };
};
