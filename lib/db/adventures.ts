import { and, asc, count, eq, inArray, or } from "drizzle-orm";
import {
  type AdventureImageAsset,
  getAdventureImageUrls,
} from "@/lib/adventure-images";
import { deleteAdventureImageIfUnreferenced } from "@/lib/services/adventure-images";
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
  type AdventureImageExtension,
  type AdventureNodeKind,
  type AdventureNodePresentation,
  type AdventureVisibility,
  adventureImages,
  adventureNodeItems,
  adventureNodeMonsters,
  adventureNodes,
  adventures,
  encounters,
  items,
  monsters,
  users,
} from "./schema";

export class AdventureInputError extends Error {}

export interface AdventureCounts {
  adventures: number;
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
  monsters: BestiaryEntry[];
  items: Item[];
  missingStatblockCount: number;
  image?: AdventureImageAsset | null;
  caption?: string;
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
  monsterIds: string[];
  itemIds: string[];
  missingStatblockCount: number;
  imageId?: string | null;
  imageExtension?: AdventureImageExtension | null;
  caption?: string;
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
  const [[adventureCount], [encounterCount]] = await Promise.all([
    db
      .select({ count: count() })
      .from(adventures)
      .where(eq(adventures.visibility, "public")),
    db
      .select({ count: count() })
      .from(encounters)
      .where(eq(encounters.visibility, "public")),
  ]);

  return {
    adventures: adventureCount?.count ?? 0,
    encounters: encounterCount?.count ?? 0,
  };
}

export async function listPublicAdventures(): Promise<AdventureOverview[]> {
  const db = getDatabase();
  const rows = await db
    .select({ adventure: adventures, creator: users })
    .from(adventures)
    .innerJoin(users, eq(adventures.userId, users.id))
    .where(eq(adventures.visibility, "public"))
    .orderBy(asc(adventures.name));

  return rows.map(toAdventureOverview);
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

  return rows.map(toAdventureOverview);
}

function toAdventureOverview({
  adventure,
  creator,
}: {
  adventure: typeof adventures.$inferSelect;
  creator: typeof users.$inferSelect;
}): AdventureOverview {
  return {
    id: adventure.id,
    name: adventure.name,
    tagline: adventure.tagline,
    summary: adventure.summary,
    visibility: adventure.visibility,
    creator: toUser(creator),
    createdAt: adventure.createdAt ? new Date(adventure.createdAt) : new Date(),
    updatedAt: adventure.updatedAt ? new Date(adventure.updatedAt) : new Date(),
  };
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

  return rows.map(toAdventureOverview);
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
  const nodeIds = nodeRows.map((node) => node.id);
  const monsterRelations =
    nodeIds.length > 0
      ? await db
          .select()
          .from(adventureNodeMonsters)
          .where(inArray(adventureNodeMonsters.nodeId, nodeIds))
          .orderBy(asc(adventureNodeMonsters.orderIndex))
      : [];
  const itemRelations =
    nodeIds.length > 0
      ? await db
          .select()
          .from(adventureNodeItems)
          .where(inArray(adventureNodeItems.nodeId, nodeIds))
          .orderBy(asc(adventureNodeItems.orderIndex))
      : [];
  const [encounterOverviews, statblockMonsters, statblockItems] =
    await Promise.all([
      findEncounterOverviewsByIds(
        nodeRows.flatMap((node) => (node.encounterId ? [node.encounterId] : []))
      ),
      findBestiaryEntriesByIds(
        monsterRelations.flatMap((relation) =>
          relation.monsterId ? [relation.monsterId] : []
        )
      ),
      findItemsByIds(
        itemRelations.flatMap((relation) =>
          relation.itemId ? [relation.itemId] : []
        )
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

  return {
    id: row.adventure.id,
    name: row.adventure.name,
    tagline: row.adventure.tagline,
    summary: row.adventure.summary,
    visibility: row.adventure.visibility,
    creator: toUser(row.creator),
    nodes: nodeRows.map((node) => {
      const encounter = getEncounter(node);
      const nodeMonsterRelations = monsterRelations.filter(
        (relation) => relation.nodeId === node.id
      );
      const nodeItemRelations = itemRelations.filter(
        (relation) => relation.nodeId === node.id
      );
      const nodeMonsters = nodeMonsterRelations.flatMap((relation) => {
        const monster = relation.monsterId
          ? statblockMonsterMap.get(relation.monsterId)
          : undefined;
        return monster && canDisplayStatblock(monster) ? [monster] : [];
      });
      const nodeItems = nodeItemRelations.flatMap((relation) => {
        const item = relation.itemId
          ? statblockItemMap.get(relation.itemId)
          : undefined;
        return item && canDisplayStatblock(item) ? [item] : [];
      });
      const relationCount =
        nodeMonsterRelations.length + nodeItemRelations.length;
      return {
        id: node.id,
        parentId: node.parentId,
        kind: node.kind,
        orderIndex: node.orderIndex,
        title: node.title,
        content: node.content,
        encounter,
        monsters: nodeMonsters,
        items: nodeItems,
        missingStatblockCount: Math.max(
          0,
          relationCount - nodeMonsters.length - nodeItems.length
        ),
        image:
          node.kind === "image" && node.imageId && node.imageExtension
            ? getAdventureImageUrls(
                row.adventure.userId,
                node.imageId,
                node.imageExtension
              )
            : null,
        caption: node.caption,
        referenceRemoved: (node.kind === "encounter" && !encounter) || false,
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
  if (!name) throw new AdventureInputError("Adventure name is required");
  if (input.nodes.length > 400) {
    throw new AdventureInputError(
      "Adventures may contain at most 400 content blocks"
    );
  }

  const nodeIds = new Set<string>();
  const imageIds = new Set<string>();
  for (const node of input.nodes) {
    if (!node.id || nodeIds.has(node.id)) {
      throw new AdventureInputError("Adventure sections must have unique IDs");
    }
    nodeIds.add(node.id);
    if (node.kind === "section" && !node.title.trim()) {
      throw new AdventureInputError("Section titles are required");
    }
    if (node.kind === "section" && node.content) {
      throw new AdventureInputError("Sections cannot contain text content");
    }
    if (node.kind === "encounter" && !node.encounterId) {
      throw new AdventureInputError(
        "Encounter sections must select an encounter"
      );
    }
    if (
      node.kind === "image" &&
      (!node.imageId ||
        !isValidUUID(node.imageId) ||
        !node.imageExtension ||
        !["jpg", "png", "webp"].includes(node.imageExtension))
    ) {
      throw new AdventureInputError("Image sections must upload an image");
    }
    if (node.kind === "image" && node.imageId) {
      if (imageIds.has(node.imageId)) {
        throw new AdventureInputError(
          "Each adventure image may be used only once"
        );
      }
      imageIds.add(node.imageId);
    }
    if (
      !Number.isInteger(node.missingStatblockCount) ||
      node.missingStatblockCount < 0 ||
      node.missingStatblockCount > 10
    ) {
      throw new AdventureInputError(
        "Missing statblock count must be an integer from 0 to 10"
      );
    }
    const references =
      (node.kind === "monsters" ? node.monsterIds.length : 0) +
      (node.kind === "items" ? node.itemIds.length : 0) +
      node.missingStatblockCount;
    if (
      (node.kind === "monsters" || node.kind === "items") &&
      references > 10
    ) {
      throw new AdventureInputError(
        "Statblock groups may contain at most 10 references"
      );
    }
    if (
      new Set(node.monsterIds).size !== node.monsterIds.length ||
      new Set(node.itemIds).size !== node.itemIds.length
    ) {
      throw new AdventureInputError(
        "Statblock groups cannot contain duplicates"
      );
    }
  }

  for (const node of input.nodes) {
    if (!node.parentId && node.kind !== "section") {
      throw new AdventureInputError(
        "Only sections may appear at the top level"
      );
    }
    if (node.parentId && !nodeIds.has(node.parentId)) {
      throw new AdventureInputError("Adventure section parent was not found");
    }
    if (node.parentId) {
      const parent = input.nodes.find(
        (candidate) => candidate.id === node.parentId
      );
      if (parent?.kind !== "section") {
        throw new AdventureInputError(
          "Only sections may contain child content"
        );
      }
      const grandparent = parent.parentId
        ? input.nodes.find((candidate) => candidate.id === parent.parentId)
        : undefined;
      if (node.kind === "section" && grandparent?.parentId) {
        throw new AdventureInputError(
          "Adventure content may be nested only two levels"
        );
      }
    }
    const ancestors = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId) {
      if (ancestors.has(parentId)) {
        throw new AdventureInputError(
          "Adventure sections cannot contain a cycle"
        );
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
  db: Parameters<
    Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
  >[0],
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
    throw new AdventureInputError("One or more encounters are unavailable");
  }
}

async function validateStatblockAccess(
  db: Parameters<
    Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
  >[0],
  userId: string,
  visibility: AdventureVisibility,
  nodes: AdventureNodeInput[]
) {
  const monsterIds = [
    ...new Set(
      nodes.flatMap((node) => (node.kind === "monsters" ? node.monsterIds : []))
    ),
  ];
  const itemIds = [
    ...new Set(
      nodes.flatMap((node) => (node.kind === "items" ? node.itemIds : []))
    ),
  ];
  if (monsterIds.length === 0 && itemIds.length === 0) return;

  const monsterVisibility =
    visibility === "public"
      ? eq(monsters.visibility, "public")
      : or(eq(monsters.visibility, "public"), eq(monsters.userId, userId));
  const itemVisibility =
    visibility === "public"
      ? eq(items.visibility, "public")
      : or(eq(items.visibility, "public"), eq(items.userId, userId));
  const accessibleMonsters =
    monsterIds.length > 0
      ? await db
          .select({ id: monsters.id })
          .from(monsters)
          .where(and(inArray(monsters.id, monsterIds), monsterVisibility))
      : [];
  const accessibleItems =
    itemIds.length > 0
      ? await db
          .select({ id: items.id })
          .from(items)
          .where(and(inArray(items.id, itemIds), itemVisibility))
      : [];
  if (
    accessibleMonsters.length !== monsterIds.length ||
    accessibleItems.length !== itemIds.length
  ) {
    throw new AdventureInputError("One or more statblocks are unavailable");
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
        const persistedId = crypto.randomUUID();
        insertedIds.set(node.id, persistedId);
        return {
          id: persistedId,
          adventureId,
          parentId: node.parentId ? insertedIds.get(node.parentId) : undefined,
          kind: node.kind,
          orderIndex: node.orderIndex,
          title: node.kind === "encounter" ? "" : node.title.trim(),
          content:
            node.kind === "encounter" ||
            node.kind === "monsters" ||
            node.kind === "items"
              ? ""
              : node.content,
          encounterId: node.kind === "encounter" ? node.encounterId : undefined,
          imageId: node.kind === "image" ? node.imageId : undefined,
          imageExtension:
            node.kind === "image" ? node.imageExtension : undefined,
          caption: node.kind === "image" ? node.caption?.trim() : "",
          presentation:
            node.kind === "callout" ? (node.presentation ?? "note") : undefined,
        };
      })
    );
    for (const node of ready) {
      const nodeId = insertedIds.get(node.id);
      if (!nodeId) throw new Error("Adventure section was not inserted");
      const ids =
        node.kind === "monsters"
          ? node.monsterIds
          : node.kind === "items"
            ? node.itemIds
            : [];
      const values = [
        ...ids.map((entityId, orderIndex) => ({ entityId, orderIndex })),
        ...Array.from({ length: node.missingStatblockCount }, (_, offset) => ({
          entityId: null,
          orderIndex: ids.length + offset,
        })),
      ];
      if (node.kind === "monsters" && values.length > 0) {
        await tx.insert(adventureNodeMonsters).values(
          values.map(({ entityId, orderIndex }) => ({
            nodeId,
            monsterId: entityId,
            orderIndex,
          }))
        );
      } else if (node.kind === "items" && values.length > 0) {
        await tx.insert(adventureNodeItems).values(
          values.map(({ entityId, orderIndex }) => ({
            nodeId,
            itemId: entityId,
            orderIndex,
          }))
        );
      }
    }
    const readyIds = new Set(ready.map((node) => node.id));
    for (let index = pending.length - 1; index >= 0; index--) {
      if (readyIds.has(pending[index].id)) pending.splice(index, 1);
    }
  }
}

async function attachAdventureImages(
  tx: Parameters<
    Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
  >[0],
  adventureId: string,
  userId: string,
  nodes: AdventureNodeInput[]
) {
  const requestedImages = new Map(
    nodes.flatMap((node) =>
      node.kind === "image" && node.imageId && node.imageExtension
        ? [[node.imageId, node.imageExtension]]
        : []
    )
  );
  if (requestedImages.size === 0) return;

  const imageIds = [...requestedImages.keys()];
  const availableImages = await tx
    .select({
      id: adventureImages.id,
      extension: adventureImages.extension,
      status: adventureImages.status,
    })
    .from(adventureImages)
    .where(
      and(
        eq(adventureImages.userId, userId),
        inArray(adventureImages.id, imageIds)
      )
    );
  const existingReferences = await tx
    .select({
      adventureId: adventureNodes.adventureId,
      imageId: adventureNodes.imageId,
    })
    .from(adventureNodes)
    .where(inArray(adventureNodes.imageId, imageIds));
  const referencedAdventureByImage = new Map(
    existingReferences.flatMap((reference) =>
      reference.imageId ? [[reference.imageId, reference.adventureId]] : []
    )
  );
  if (
    availableImages.length !== requestedImages.size ||
    availableImages.some(
      (image) =>
        requestedImages.get(image.id) !== image.extension ||
        (image.status !== "ready" &&
          !(
            image.status === "attached" &&
            referencedAdventureByImage.get(image.id) === adventureId
          ))
    )
  ) {
    throw new AdventureInputError(
      "One or more adventure images are unavailable"
    );
  }

  await tx
    .update(adventureImages)
    .set({ status: "attached", updatedAt: new Date().toISOString() })
    .where(
      and(
        inArray(adventureImages.id, imageIds),
        eq(adventureImages.status, "ready")
      )
    );
}

export async function createAdventure(
  userId: string,
  input: AdventureInput
): Promise<Adventure> {
  const name = validateAdventureInput(input);
  const db = getDatabase();
  const id = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await validateEncounterAccess(tx, userId, input.visibility, input.nodes);
    await validateStatblockAccess(tx, userId, input.visibility, input.nodes);
    await attachAdventureImages(tx, id, userId, input.nodes);
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
  if (!isValidUUID(id)) throw new AdventureInputError("Invalid adventure ID");
  const name = validateAdventureInput(input);
  const db = getDatabase();
  let previousImageIds = new Set<string>();
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: adventures.id })
      .from(adventures)
      .where(and(eq(adventures.id, id), eq(adventures.userId, userId)))
      .limit(1);
    if (!existing) throw new AdventureInputError("Adventure not found");
    previousImageIds = new Set(
      (
        await tx
          .select({ imageId: adventureNodes.imageId })
          .from(adventureNodes)
          .where(eq(adventureNodes.adventureId, id))
      ).flatMap((node) => (node.imageId ? [node.imageId] : []))
    );
    await validateEncounterAccess(tx, userId, input.visibility, input.nodes);
    await validateStatblockAccess(tx, userId, input.visibility, input.nodes);
    await attachAdventureImages(tx, id, userId, input.nodes);
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
  const currentImageIds = new Set(
    input.nodes.flatMap((node) => (node.imageId ? [node.imageId] : []))
  );
  await Promise.all(
    [...previousImageIds]
      .filter((imageId) => !currentImageIds.has(imageId))
      .map((imageId) => deleteAdventureImageIfUnreferenced(imageId, userId))
  );
  return adventure;
}
