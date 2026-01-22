import type { toItem } from "@/lib/services/items/converters";
import type { MonsterMini } from "@/lib/services/monsters/types";
import type { CollectionOverview, Family, User } from "@/lib/types";
import type { toMonster } from "../services/monsters/converters";
import type { toCompanion } from "./converters";

export type RecentContentItem =
  | {
      type: "monster";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: ReturnType<typeof toMonster>;
    }
  | {
      type: "item";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: ReturnType<typeof toItem>;
    }
  | {
      type: "companion";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: ReturnType<typeof toCompanion>;
    }
  | {
      type: "collection";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: CollectionOverview;
    }
  | {
      type: "family";
      id: string;
      name: string;
      createdAt: Date;
      creator: User;
      data: Family & { monsters: MonsterMini[] };
    };

export async function getRecentContent(
  _limit: number = 20
): Promise<RecentContentItem[]> {
  return [];
}

export async function getRecentPublicContent(
  _limit: number = 20
): Promise<RecentContentItem[]> {
  return [];
}
