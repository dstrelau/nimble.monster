import { and, asc, count, eq, inArray, or } from "drizzle-orm";
import { findItemsByIds, type Item } from "@/lib/services/items";
import {
  type BestiaryEntry,
  findBestiaryEntriesByIds,
} from "@/lib/services/monsters";
import type { EncounterOverview, User } from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { toUser } from "./converters";
import { getDatabase } from "./drizzle";
import { findEncounterOverviewsByIds } from "./encounter";
import {
  type AdventureNodeKind,
  type AdventureNodePresentation,
  type AdventureVisibility,
  adventureNodes,
  adventures,
  encounters,
  items,
  monsters,
  users,
} from "./schema";

export interface AdventureCounts {
  encounters: number;
}

export interface AdventureEncounterReference {
  id: string;
  name: string;
  visibility?: AdventureVisibility;
}

export type AdventureStatblock =
  | { entityType: "monster"; entity: BestiaryEntry }
  | { entityType: "item"; entity: Item };

export interface AdventureNode {
  id: string;
  parentId: string | null;
  kind: AdventureNodeKind;
  orderIndex: number;
  title: string;
  content: string;
  encounter: EncounterOverview | null;
  statblock: AdventureStatblock | null;
  referenceRemoved: boolean;
  presentation: AdventureNodePresentation | null;
}

export interface Adventure {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  visibility: AdventureVisibility;
  creator: User;
  nodes: AdventureNode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdventureOverview {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  visibility: AdventureVisibility;
  creator: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdventureNodeInput {
  id: string;
  parentId: string | null;
  kind: AdventureNodeKind;
  orderIndex: number;
  title: string;
  content: string;
  encounterId: string | null;
  monsterId: string | null;
  itemId: string | null;
  presentation: AdventureNodePresentation | null;
}

export interface AdventureInput {
  name: string;
  tagline: string;
  summary: string;
  visibility: AdventureVisibility;
  nodes: AdventureNodeInput[];
}

export async function getAdventureCounts(): Promise<AdventureCounts> {
  const db = getDatabase();
  const [encounterCount] = await db
    .select({ count: count() })
    .from(encounters)
    .where(eq(encounters.visibility, "public"));

  return {
    encounters: encounterCount?.count ?? 0,
  };
}

export async function listAdventuresForUser(
  userId: string
): Promise<AdventureOverview[]> {
  const db = getDatabase();
  const rows = await db
    .select({ adventure: adventures, creator: users })
    .from(adventures)
    .innerJoin(users, eq(adventures.userId, users.id))
    .where(eq(adventures.userId, userId))
    .orderBy(asc(adventures.name));

  return rows.map(({ adventure, creator }) => ({
    id: adventure.id,
    name: adventure.name,
    tagline: adventure.tagline,
    summary: adventure.summary,
    visibility: adventure.visibility,
    creator: toUser(creator),
    createdAt: adventure.createdAt ? new Date(adventure.createdAt) : new Date(),
    updatedAt: adventure.updatedAt ? new Date(adventure.updatedAt) : new Date(),
  }));
}

export async function listPublicAdventuresForUser(
  userId: string
): Promise<AdventureOverview[]> {
  const db = getDatabase();
  const rows = await db
    .select({ adventure: adventures, creator: users })
    .from(adventures)
    .innerJoin(users, eq(adventures.userId, users.id))
    .where(
      and(eq(adventures.userId, userId), eq(adventures.visibility, "public"))
    )
    .orderBy(asc(adventures.name));

  return rows.map(({ adventure, creator }) => ({
    id: adventure.id,
    name: adventure.name,
    tagline: adventure.tagline,
    summary: adventure.summary,
    visibility: adventure.visibility,
    creator: toUser(creator),
    createdAt: adventure.createdAt ? new Date(adventure.createdAt) : new Date(),
    updatedAt: adventure.updatedAt ? new Date(adventure.updatedAt) : new Date(),
  }));
}

export async function findAdventure(id: string): Promise<Adventure | null> {
  if (!isValidUUID(id)) return null;
  const db = getDatabase();
  const [row] = await db
    .select({ adventure: adventures, creator: users })
    .from(adventures)
    .innerJoin(users, eq(adventures.userId, users.id))
    .where(eq(adventures.id, id))
    .limit(1);
  if (!row) return null;

  const nodeRows = await db
    .select()
    .from(adventureNodes)
    .where(eq(adventureNodes.adventureId, id))
    .orderBy(asc(adventureNodes.orderIndex));
  const [encounterOverviews, statblockMonsters, statblockItems] =
    await Promise.all([
      findEncounterOverviewsByIds(
        nodeRows.flatMap((node) => (node.encounterId ? [node.encounterId] : []))
      ),
      findBestiaryEntriesByIds(
        nodeRows.flatMap((node) => (node.monsterId ? [node.monsterId] : []))
      ),
      findItemsByIds(
        nodeRows.flatMap((node) => (node.itemId ? [node.itemId] : []))
      ),
    ]);
  const encounterMap = new Map(
    encounterOverviews.map((encounter) => [encounter.id, encounter])
  );
  const statblockMonsterMap = new Map(
    statblockMonsters.map((monster) => [monster.id, monster])
  );
  const statblockItemMap = new Map(
    statblockItems.map((item) => [item.id, item])
  );
  const canDisplayStatblock = (entity: BestiaryEntry | Item) =>
    entity.visibility === "public" ||
    (row.adventure.visibility === "private" &&
      entity.creator.id === row.adventure.userId);
  const getEncounter = (node: typeof adventureNodes.$inferSelect) => {
    const encounter = node.encounterId
      ? encounterMap.get(node.encounterId)
      : undefined;
    return encounter &&
      (encounter.visibility === "public" ||
        (row.adventure.visibility === "private" &&
          encounter.creator.id === row.adventure.userId))
      ? encounter
      : null;
  };
  const getStatblock = (node: typeof adventureNodes.$inferSelect) => {
    const monster = node.monsterId
      ? statblockMonsterMap.get(node.monsterId)
      : undefined;
    if (monster && canDisplayStatblock(monster)) {
      return {
        entityType: "monster",
        entity: monster,
      } satisfies AdventureStatblock;
    }
    const item = node.itemId ? statblockItemMap.get(node.itemId) : undefined;
    return item && canDisplayStatblock(item)
      ? ({ entityType: "item", entity: item } satisfies AdventureStatblock)
      : null;
  };

  return {
    id: row.adventure.id,
    name: row.adventure.name,
    tagline: row.adventure.tagline,
    summary: row.adventure.summary,
    visibility: row.adventure.visibility,
    creator: toUser(row.creator),
    nodes: nodeRows.map((node) => {
      const encounter = getEncounter(node);
      const statblock = getStatblock(node);
      return {
        id: node.id,
        parentId: node.parentId,
        kind: node.kind,
        orderIndex: node.orderIndex,
        title: node.title,
        content: node.content,
        encounter,
        statblock,
        referenceRemoved:
          (node.kind === "encounter" && !encounter) ||
          (node.kind === "statblock" && !statblock),
        presentation: node.presentation,
      };
    }),
    createdAt: row.adventure.createdAt
      ? new Date(row.adventure.createdAt)
      : new Date(),
    updatedAt: row.adventure.updatedAt
      ? new Date(row.adventure.updatedAt)
      : new Date(),
  };
}

function validateAdventureInput(input: AdventureInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Adventure name is required");
  if (input.nodes.length > 200) {
    throw new Error("Adventures may contain at most 200 sections");
  }

  const nodeIds = new Set<string>();
  for (const node of input.nodes) {
    if (!node.id || nodeIds.has(node.id)) {
      throw new Error("Adventure sections must have unique IDs");
    }
    nodeIds.add(node.id);
    if (node.kind === "section" && !node.title.trim()) {
      throw new Error("Section titles are required");
    }
    if (node.kind === "encounter" && !node.encounterId) {
      throw new Error("Encounter sections must select an encounter");
    }
    if (
      node.kind === "statblock" &&
      Number(Boolean(node.monsterId)) + Number(Boolean(node.itemId)) !== 1
    ) {
      throw new Error("Statblock sections must select one monster or item");
    }
  }

  for (const node of input.nodes) {
    if (node.parentId && !nodeIds.has(node.parentId)) {
      throw new Error("Adventure section parent was not found");
    }
    if (node.parentId) {
      const parent = input.nodes.find(
        (candidate) => candidate.id === node.parentId
      );
      if (parent?.kind !== "section") {
        throw new Error("Only sections may contain child content");
      }
      const grandparent = parent.parentId
        ? input.nodes.find((candidate) => candidate.id === parent.parentId)
        : undefined;
      if (grandparent?.parentId) {
        throw new Error("Adventure content may be nested only two levels");
      }
    }
    const ancestors = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId) {
      if (ancestors.has(parentId)) {
        throw new Error("Adventure sections cannot contain a cycle");
      }
      ancestors.add(parentId);
      parentId =
        input.nodes.find((candidate) => candidate.id === parentId)?.parentId ??
        null;
    }
  }

  return name;
}

async function validateEncounterAccess(
  userId: string,
  visibility: AdventureVisibility,
  nodes: AdventureNodeInput[]
) {
  const encounterIds = [
    ...new Set(
      nodes.flatMap((node) => (node.encounterId ? [node.encounterId] : []))
    ),
  ];
  if (encounterIds.length === 0) return;

  const db = getDatabase();
  const encounterVisibility =
    visibility === "public"
      ? eq(encounters.visibility, "public")
      : or(
          eq(encounters.visibility, "public"),
          eq(encounters.creatorId, userId)
        );
  const accessible = await db
    .select({ id: encounters.id })
    .from(encounters)
    .where(and(inArray(encounters.id, encounterIds), encounterVisibility));
  if (accessible.length !== encounterIds.length) {
    throw new Error("One or more encounters are unavailable");
  }
}

async function validateStatblockAccess(
  userId: string,
  visibility: AdventureVisibility,
  nodes: AdventureNodeInput[]
) {
  const monsterIds = [
    ...new Set(
      nodes.flatMap((node) =>
        node.kind === "statblock" && node.monsterId ? [node.monsterId] : []
      )
    ),
  ];
  const itemIds = [
    ...new Set(
      nodes.flatMap((node) =>
        node.kind === "statblock" && node.itemId ? [node.itemId] : []
      )
    ),
  ];
  if (monsterIds.length === 0 && itemIds.length === 0) return;

  const db = getDatabase();
  const monsterVisibility =
    visibility === "public"
      ? eq(monsters.visibility, "public")
      : or(eq(monsters.visibility, "public"), eq(monsters.userId, userId));
  const itemVisibility =
    visibility === "public"
      ? eq(items.visibility, "public")
      : or(eq(items.visibility, "public"), eq(items.userId, userId));
  const [accessibleMonsters, accessibleItems] = await Promise.all([
    monsterIds.length > 0
      ? db
          .select({ id: monsters.id })
          .from(monsters)
          .where(and(inArray(monsters.id, monsterIds), monsterVisibility))
      : [],
    itemIds.length > 0
      ? db
          .select({ id: items.id })
          .from(items)
          .where(and(inArray(items.id, itemIds), itemVisibility))
      : [],
  ]);
  if (
    accessibleMonsters.length !== monsterIds.length ||
    accessibleItems.length !== itemIds.length
  ) {
    throw new Error("One or more statblocks are unavailable");
  }
}

async function insertAdventureChildren(
  tx: Parameters<
    Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
  >[0],
  adventureId: string,
  input: AdventureInput
) {
  const pending = [...input.nodes];
  const insertedIds = new Map<string, string>();
  while (pending.length > 0) {
    const ready = pending.filter(
      (node) => !node.parentId || insertedIds.has(node.parentId)
    );
    if (ready.length === 0) {
      throw new Error("Adventure sections could not be ordered");
    }
    await tx.insert(adventureNodes).values(
      ready.map((node) => {
        const id = crypto.randomUUID();
        insertedIds.set(node.id, id);
        return {
          id,
          adventureId,
          parentId: node.parentId ? insertedIds.get(node.parentId) : undefined,
          kind: node.kind,
          orderIndex: node.orderIndex,
          title:
            node.kind === "encounter" || node.kind === "statblock"
              ? ""
              : node.title.trim(),
          content:
            node.kind === "encounter" || node.kind === "statblock"
              ? ""
              : node.content,
          encounterId: node.kind === "encounter" ? node.encounterId : undefined,
          monsterId: node.kind === "statblock" ? node.monsterId : undefined,
          itemId: node.kind === "statblock" ? node.itemId : undefined,
          presentation:
            node.kind === "callout" ? (node.presentation ?? "note") : undefined,
        };
      })
    );
    const readyIds = new Set(ready.map((node) => node.id));
    for (let index = pending.length - 1; index >= 0; index--) {
      if (readyIds.has(pending[index].id)) pending.splice(index, 1);
    }
  }
}

export async function createAdventure(
  userId: string,
  input: AdventureInput
): Promise<Adventure> {
  const name = validateAdventureInput(input);
  await Promise.all([
    validateEncounterAccess(userId, input.visibility, input.nodes),
    validateStatblockAccess(userId, input.visibility, input.nodes),
  ]);
  const db = getDatabase();
  const id = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(adventures).values({
      id,
      userId,
      name,
      tagline: input.tagline.trim(),
      summary: input.summary.trim(),
      visibility: input.visibility,
    });
    await insertAdventureChildren(tx, id, input);
  });

  const adventure = await findAdventure(id);
  if (!adventure) throw new Error("Failed to create adventure");
  return adventure;
}

export async function updateAdventure(
  id: string,
  userId: string,
  input: AdventureInput
): Promise<Adventure> {
  if (!isValidUUID(id)) throw new Error("Invalid adventure ID");
  const name = validateAdventureInput(input);
  await Promise.all([
    validateEncounterAccess(userId, input.visibility, input.nodes),
    validateStatblockAccess(userId, input.visibility, input.nodes),
  ]);
  const db = getDatabase();
  const [existing] = await db
    .select({ id: adventures.id })
    .from(adventures)
    .where(and(eq(adventures.id, id), eq(adventures.userId, userId)))
    .limit(1);
  if (!existing) throw new Error("Adventure not found");

  await db.transaction(async (tx) => {
    await tx
      .update(adventures)
      .set({
        name,
        tagline: input.tagline.trim(),
        summary: input.summary.trim(),
        visibility: input.visibility,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(adventures.id, id));
    await tx.delete(adventureNodes).where(eq(adventureNodes.adventureId, id));
    await insertAdventureChildren(tx, id, input);
  });

  const adventure = await findAdventure(id);
  if (!adventure) throw new Error("Failed to update adventure");
  return adventure;
}
