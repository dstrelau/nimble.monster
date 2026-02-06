import { fetchApi } from "@/lib/api";
import type { Monster } from "@/lib/services/monsters/types";

export interface JSONAPIFamily {
  type: "families";
  id: string;
  attributes: {
    name: string;
    description?: string;
    abilities: Array<{ name: string; description: string }>;
  };
}

export interface JSONAPIMonster {
  type: "monsters";
  id?: string;
  attributes: {
    name: string;
    hp: number;
    level: number | string;
    size: string;
    armor: string;
    kind?: string;
    movement: Array<{ speed: number } | { mode: string; speed: number }>;
    abilities: Array<{ name: string; description: string }>;
    actions: Array<{
      name: string;
      description?: string;
      damage?: { roll: string };
      target?: { reach: number } | { range: number };
    }>;
    actionsInstructions: string;
    description?: string;
    legendary: boolean;
    minion?: boolean;
    bloodied?: string;
    lastStand?: string;
    saves?: {
      all?: number;
      str?: number;
      dex?: number;
      int?: number;
      wil?: number;
    };
    paperforgeId?: string;
    paperforgeImageUrl?: string;
  };
  relationships?: {
    family?: {
      data: {
        type: "families";
        id: string;
      };
    };
  };
}

interface JSONAPIResponse {
  data: JSONAPIMonster[];
  links?: {
    next: string;
  };
}

interface JSONAPISingleResponse {
  data: JSONAPIMonster;
}

export interface MonsterSearchResult {
  data: Monster[];
  nextCursor?: string;
}

function parseMonster(data: JSONAPIMonster): Monster {
  const attrs = data.attributes;

  const speeds = {
    speed: 6,
    fly: 0,
    swim: 0,
    climb: 0,
    burrow: 0,
    teleport: 0,
  };

  attrs.movement.forEach((m) => {
    if ("mode" in m) {
      speeds[m.mode as keyof typeof speeds] = m.speed;
    } else {
      speeds.speed = m.speed;
    }
  });

  const actions = attrs.actions.map((a) => ({
    id: crypto.randomUUID(),
    name: a.name,
    description: a.description,
    damage: a.damage?.roll,
    range:
      a.target && "reach" in a.target
        ? `${a.target.reach}ft`
        : a.target && "range" in a.target
          ? `${a.target.range}ft`
          : undefined,
  }));

  const abilities = attrs.abilities.map((a) => ({
    id: crypto.randomUUID(),
    name: a.name,
    description: a.description,
  }));

  const levelInt =
    typeof attrs.level === "number"
      ? attrs.level
      : attrs.level === "1/4"
        ? -4
        : attrs.level === "1/3"
          ? -3
          : attrs.level === "1/2"
            ? -2
            : 1;

  return {
    id: data.id || crypto.randomUUID(),
    name: attrs.name,
    hp: attrs.hp,
    level: String(attrs.level),
    levelInt,
    size: attrs.size as Monster["size"],
    armor: attrs.armor as Monster["armor"],
    kind: attrs.kind,
    legendary: attrs.legendary,
    minion: attrs.minion ?? false,
    visibility: "public",
    paperforgeId: attrs.paperforgeId,
    createdAt: new Date(),
    ...speeds,
    abilities,
    actions,
    actionPreface: attrs.actionsInstructions || "",
    moreInfo: attrs.description,
    bloodied: attrs.bloodied,
    lastStand: attrs.lastStand,
    families: [],
    creator: {
      id: "",
      discordId: "",
      username: "",
      displayName: "",
    },
    updatedAt: new Date(),
    imageUrl: attrs.paperforgeImageUrl,
  };
}

export async function searchMonsters(
  searchTerm?: string,
  cursor?: string
): Promise<MonsterSearchResult> {
  const params = new URLSearchParams();
  if (searchTerm) params.set("search", searchTerm);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", "20");

  const response = await fetchApi<JSONAPIResponse>(
    `/api/monsters?${params.toString()}`
  );

  const monsters = response.data.map(parseMonster);

  let nextCursor: string | undefined;
  if (response.links?.next) {
    try {
      const nextUrl = new URL(response.links.next, window.location.origin);
      nextCursor = nextUrl.searchParams.get("cursor") || undefined;
    } catch {
      nextCursor = undefined;
    }
  }

  return { data: monsters, nextCursor };
}

export async function getMonster(id: string): Promise<Monster> {
  const response = await fetchApi<JSONAPISingleResponse>(`/api/monsters/${id}`);
  return parseMonster(response.data);
}
