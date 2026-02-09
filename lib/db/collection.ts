import { and, asc, count, eq, inArray } from "drizzle-orm";
import { findSpellSchoolsByIds } from "@/lib/db/school";
import { findSubclassesByIds } from "@/lib/db/subclass";
import { findAncestriesByIds } from "@/lib/services/ancestries/repository";
import type { AncestryMini } from "@/lib/services/ancestries/types";
import { findBackgroundsByIds } from "@/lib/services/backgrounds/repository";
import type { BackgroundMini } from "@/lib/services/backgrounds/types";
import { findCompanionsByIds } from "@/lib/services/companions/repository";
import { findItemsByIds } from "@/lib/services/items";
import type { ItemMini } from "@/lib/services/items/types";
import { findMonstersByIds } from "@/lib/services/monsters";
import type { MonsterMini } from "@/lib/services/monsters/types";
import type {
  Collection,
  CollectionOverview,
  CompanionMini,
  SpellSchoolMini,
  SubclassMini,
  User,
} from "@/lib/types";
import { isValidUUID } from "@/lib/utils/validation";
import { getDatabase } from "./drizzle";
import {
  type AncestryRow,
  ancestries,
  ancestriesCollections,
  type BackgroundRow,
  backgrounds,
  backgroundsCollections,
  type CollectionRow,
  type CompanionRow,
  collections,
  companions,
  companionsCollections,
  type ItemRow,
  items,
  itemsCollections,
  type MonsterRow,
  monsters,
  monstersCollections,
  type SpellSchoolRow,
  type SubclassRow,
  spellSchools,
  spellSchoolsCollections,
  subclasses,
  subclassesCollections,
  type UserRow,
  users,
} from "./schema";

const toUser = (u: UserRow): User => ({
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

const toMonsterMini = (m: MonsterRow): MonsterMini => ({
  id: m.id,
  hp: m.hp,
  legendary: m.legendary || false,
  minion: m.minion,
  level: m.level,
  levelInt: m.levelInt,
  name: m.name,
  visibility: (m.visibility ?? "public") as "public" | "private",
  size: m.size,
  armor: m.armor === "" ? "none" : m.armor,
  paperforgeId: m.paperforgeId ?? undefined,
  createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
  role: m.role as MonsterMini["role"],
});

const toItemMini = (i: ItemRow): ItemMini => ({
  id: i.id,
  name: i.name,
  kind: i.kind || undefined,
  rarity: (i.rarity ?? "unspecified") as ItemMini["rarity"],
  visibility: (i.visibility ?? "public") as "public" | "private",
  imageIcon: i.imageIcon || undefined,
  imageBgIcon: i.imageBgIcon || undefined,
  imageColor: i.imageColor || undefined,
  imageBgColor: i.imageBgColor || undefined,
  createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
  updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(),
});

const toSpellSchoolMini = (s: SpellSchoolRow): SpellSchoolMini => ({
  id: s.id,
  name: s.name,
  visibility: (s.visibility ?? "public") as "public" | "private",
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

const toCompanionMini = (c: CompanionRow): CompanionMini => ({
  id: c.id,
  name: c.name,
  hp_per_level: c.hpPerLevel,
  wounds: c.wounds,
  visibility: (c.visibility ?? "public") as "public" | "private",
});

const toAncestryMini = (a: AncestryRow): AncestryMini => {
  let sizes: string[] = [];
  try {
    const raw = a.size;
    sizes =
      typeof raw === "string"
        ? raw.includes(",")
          ? raw.split(",")
          : raw
            ? [raw]
            : []
        : [];
  } catch {
    sizes = [];
  }
  return {
    id: a.id,
    name: a.name,
    size: sizes as AncestryMini["size"],
    rarity: (a.rarity ?? "common") as AncestryMini["rarity"],
    createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
    updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
  };
};

const toBackgroundMini = (b: BackgroundRow): BackgroundMini => ({
  id: b.id,
  name: b.name,
  requirement: b.requirement ?? undefined,
  createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
  updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
});

const toSubclassMini = (s: SubclassRow): SubclassMini => ({
  id: s.id,
  name: s.name,
  className: s.className as SubclassMini["className"],
  namePreface: s.namePreface ?? undefined,
  tagline: s.tagline ?? undefined,
  visibility: (s.visibility ?? "public") as SubclassMini["visibility"],
  createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
});

export const listCollectionsWithMonstersForUser = async (
  discordId: string
): Promise<CollectionOverview[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];
  const user = userResult[0];

  const collectionRows = await db
    .select()
    .from(collections)
    .where(eq(collections.creatorId, user.id))
    .orderBy(asc(collections.name));

  if (collectionRows.length === 0) return [];

  const collectionIds = collectionRows.map((c) => c.id);

  // Get monsters for each collection
  const monsterLinks = await db
    .select({
      collectionId: monstersCollections.collectionId,
      monster: monsters,
    })
    .from(monstersCollections)
    .innerJoin(monsters, eq(monstersCollections.monsterId, monsters.id))
    .where(inArray(monstersCollections.collectionId, collectionIds));

  // Get items for each collection
  const itemLinks = await db
    .select({
      collectionId: itemsCollections.collectionId,
      item: items,
    })
    .from(itemsCollections)
    .innerJoin(items, eq(itemsCollections.itemId, items.id))
    .where(inArray(itemsCollections.collectionId, collectionIds));

  // Get spell schools for each collection
  const schoolLinks = await db
    .select({
      collectionId: spellSchoolsCollections.collectionId,
      school: spellSchools,
    })
    .from(spellSchoolsCollections)
    .innerJoin(
      spellSchools,
      eq(spellSchoolsCollections.spellSchoolId, spellSchools.id)
    )
    .where(inArray(spellSchoolsCollections.collectionId, collectionIds));

  // Get companions for each collection
  const companionLinks = await db
    .select({
      collectionId: companionsCollections.collectionId,
      companion: companions,
    })
    .from(companionsCollections)
    .innerJoin(companions, eq(companionsCollections.companionId, companions.id))
    .where(inArray(companionsCollections.collectionId, collectionIds));

  // Get ancestries for each collection
  const ancestryLinks = await db
    .select({
      collectionId: ancestriesCollections.collectionId,
      ancestry: ancestries,
    })
    .from(ancestriesCollections)
    .innerJoin(ancestries, eq(ancestriesCollections.ancestryId, ancestries.id))
    .where(inArray(ancestriesCollections.collectionId, collectionIds));

  // Get backgrounds for each collection
  const backgroundLinks = await db
    .select({
      collectionId: backgroundsCollections.collectionId,
      background: backgrounds,
    })
    .from(backgroundsCollections)
    .innerJoin(
      backgrounds,
      eq(backgroundsCollections.backgroundId, backgrounds.id)
    )
    .where(inArray(backgroundsCollections.collectionId, collectionIds));

  // Get subclasses for each collection
  const subclassLinks = await db
    .select({
      collectionId: subclassesCollections.collectionId,
      subclass: subclasses,
    })
    .from(subclassesCollections)
    .innerJoin(subclasses, eq(subclassesCollections.subclassId, subclasses.id))
    .where(inArray(subclassesCollections.collectionId, collectionIds));

  // Group by collection
  const monstersByCollection = new Map<string, MonsterRow[]>();
  for (const link of monsterLinks) {
    const existing = monstersByCollection.get(link.collectionId) || [];
    existing.push(link.monster);
    monstersByCollection.set(link.collectionId, existing);
  }

  const itemsByCollection = new Map<string, ItemRow[]>();
  for (const link of itemLinks) {
    const existing = itemsByCollection.get(link.collectionId) || [];
    existing.push(link.item);
    itemsByCollection.set(link.collectionId, existing);
  }

  const schoolsByCollection = new Map<string, SpellSchoolRow[]>();
  for (const link of schoolLinks) {
    const existing = schoolsByCollection.get(link.collectionId) || [];
    existing.push(link.school);
    schoolsByCollection.set(link.collectionId, existing);
  }

  const companionsByCollection = new Map<string, CompanionRow[]>();
  for (const link of companionLinks) {
    const existing = companionsByCollection.get(link.collectionId) || [];
    existing.push(link.companion);
    companionsByCollection.set(link.collectionId, existing);
  }

  const ancestriesByCollection = new Map<string, AncestryRow[]>();
  for (const link of ancestryLinks) {
    const existing = ancestriesByCollection.get(link.collectionId) || [];
    existing.push(link.ancestry);
    ancestriesByCollection.set(link.collectionId, existing);
  }

  const backgroundsByCollection = new Map<string, BackgroundRow[]>();
  for (const link of backgroundLinks) {
    const existing = backgroundsByCollection.get(link.collectionId) || [];
    existing.push(link.background);
    backgroundsByCollection.set(link.collectionId, existing);
  }

  const subclassesByCollection = new Map<string, SubclassRow[]>();
  for (const link of subclassLinks) {
    const existing = subclassesByCollection.get(link.collectionId) || [];
    existing.push(link.subclass);
    subclassesByCollection.set(link.collectionId, existing);
  }

  return collectionRows.map((c) => {
    const collectionMonsters = monstersByCollection.get(c.id) || [];
    const collectionItems = itemsByCollection.get(c.id) || [];
    const collectionSchools = schoolsByCollection.get(c.id) || [];
    const collectionCompanions = companionsByCollection.get(c.id) || [];
    const collectionAncestries = ancestriesByCollection.get(c.id) || [];
    const collectionBackgrounds = backgroundsByCollection.get(c.id) || [];
    const collectionSubclasses = subclassesByCollection.get(c.id) || [];

    const legendaryCount = collectionMonsters.filter((m) => m.legendary).length;
    const standardCount = collectionMonsters.filter(
      (m) => !m.legendary && !m.minion
    ).length;

    return {
      id: c.id,
      name: c.name,
      description: c.description || undefined,
      visibility: c.visibility as "public" | "private",
      creator: toUser(user),
      monsters: collectionMonsters.map(toMonsterMini),
      items: collectionItems.map(toItemMini),
      itemCount: collectionItems.length,
      companions: collectionCompanions.map(toCompanionMini),
      ancestries: collectionAncestries.map(toAncestryMini),
      backgrounds: collectionBackgrounds.map(toBackgroundMini),
      subclasses: collectionSubclasses.map(toSubclassMini),
      spellSchools: collectionSchools.map(toSpellSchoolMini),
      legendaryCount,
      standardCount,
      createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
    };
  });
};

export const listCollectionsWithMonstersAndItemsForUser = async (
  discordId: string
): Promise<CollectionOverview[]> => {
  return listCollectionsWithMonstersForUser(discordId);
};

export const getCollectionByIdWithMonstersItems = async (
  id: string,
  discordId: string
): Promise<Collection | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return null;
  const user = userResult[0];

  const collectionResult = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.creatorId, user.id)))
    .limit(1);

  if (collectionResult.length === 0) return null;
  const collection = collectionResult[0];

  return loadCollectionFull(db, collection, user);
};

export const getCollectionOverviewByIdWithMonstersItems = async (
  id: string,
  discordId: string
): Promise<CollectionOverview | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return null;
  const user = userResult[0];

  const collectionResult = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.creatorId, user.id)))
    .limit(1);

  if (collectionResult.length === 0) return null;

  return loadCollectionOverview(db, collectionResult[0], user);
};

export const getPublicCollectionByIdWithMonstersItems = async (
  id: string
): Promise<Collection | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  const collectionResult = await db
    .select({ collection: collections, creator: users })
    .from(collections)
    .innerJoin(users, eq(collections.creatorId, users.id))
    .where(and(eq(collections.id, id), eq(collections.visibility, "public")))
    .limit(1);

  if (collectionResult.length === 0) return null;

  return loadCollectionFull(
    db,
    collectionResult[0].collection,
    collectionResult[0].creator
  );
};

export const getUserPublicCollectionsCount = async (
  username: string
): Promise<number> => {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userResult.length === 0) return 0;

  const result = await db
    .select({ count: count() })
    .from(collections)
    .where(
      and(
        eq(collections.creatorId, userResult[0].id),
        eq(collections.visibility, "public")
      )
    );

  return result[0]?.count || 0;
};

export interface CreateCollectionInput {
  name: string;
  description?: string;
  visibility: "public" | "private";
  monsterIds?: string[];
  discordId: string;
}

export interface UpdateCollectionInput extends CreateCollectionInput {
  id: string;
  itemIds?: string[];
  companionIds?: string[];
  ancestryIds?: string[];
  backgroundIds?: string[];
  subclassIds?: string[];
  spellSchoolIds?: string[];
}

export const createCollection = async (
  input: CreateCollectionInput
): Promise<CollectionOverview> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  const collectionId = crypto.randomUUID();

  await db.insert(collections).values({
    id: collectionId,
    name: input.name,
    description: input.description || undefined,
    visibility: input.visibility,
    creatorId: user.id,
  });

  // Add monsters if provided
  if (input.monsterIds && input.monsterIds.length > 0) {
    await db.insert(monstersCollections).values(
      input.monsterIds.map((monsterId) => ({
        collectionId,
        monsterId,
      }))
    );
  }

  const collectionResult = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  return loadCollectionOverview(db, collectionResult[0], user);
};

export const updateCollection = async (
  input: UpdateCollectionInput
): Promise<CollectionOverview> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  // Verify ownership
  const existingCollection = await db
    .select()
    .from(collections)
    .where(
      and(eq(collections.id, input.id), eq(collections.creatorId, user.id))
    )
    .limit(1);

  if (existingCollection.length === 0) {
    throw new Error("Collection not found");
  }

  // Update collection
  await db
    .update(collections)
    .set({
      name: input.name,
      description: input.description || undefined,
      visibility: input.visibility,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(collections.id, input.id));

  // Sync monsters
  if (input.monsterIds) {
    await db
      .delete(monstersCollections)
      .where(eq(monstersCollections.collectionId, input.id));

    if (input.monsterIds.length > 0) {
      await db.insert(monstersCollections).values(
        input.monsterIds.map((monsterId) => ({
          collectionId: input.id,
          monsterId,
        }))
      );
    }
  }

  // Sync items
  if (input.itemIds) {
    await db
      .delete(itemsCollections)
      .where(eq(itemsCollections.collectionId, input.id));

    if (input.itemIds.length > 0) {
      await db.insert(itemsCollections).values(
        input.itemIds.map((itemId) => ({
          collectionId: input.id,
          itemId,
        }))
      );
    }
  }

  // Sync spell schools
  if (input.spellSchoolIds) {
    await db
      .delete(spellSchoolsCollections)
      .where(eq(spellSchoolsCollections.collectionId, input.id));

    if (input.spellSchoolIds.length > 0) {
      await db.insert(spellSchoolsCollections).values(
        input.spellSchoolIds.map((spellSchoolId) => ({
          collectionId: input.id,
          spellSchoolId,
        }))
      );
    }
  }

  // Sync companions
  if (input.companionIds) {
    await db
      .delete(companionsCollections)
      .where(eq(companionsCollections.collectionId, input.id));

    if (input.companionIds.length > 0) {
      await db.insert(companionsCollections).values(
        input.companionIds.map((companionId) => ({
          collectionId: input.id,
          companionId,
        }))
      );
    }
  }

  // Sync ancestries
  if (input.ancestryIds) {
    await db
      .delete(ancestriesCollections)
      .where(eq(ancestriesCollections.collectionId, input.id));

    if (input.ancestryIds.length > 0) {
      await db.insert(ancestriesCollections).values(
        input.ancestryIds.map((ancestryId) => ({
          collectionId: input.id,
          ancestryId,
        }))
      );
    }
  }

  // Sync backgrounds
  if (input.backgroundIds) {
    await db
      .delete(backgroundsCollections)
      .where(eq(backgroundsCollections.collectionId, input.id));

    if (input.backgroundIds.length > 0) {
      await db.insert(backgroundsCollections).values(
        input.backgroundIds.map((backgroundId) => ({
          collectionId: input.id,
          backgroundId,
        }))
      );
    }
  }

  // Sync subclasses
  if (input.subclassIds) {
    await db
      .delete(subclassesCollections)
      .where(eq(subclassesCollections.collectionId, input.id));

    if (input.subclassIds.length > 0) {
      await db.insert(subclassesCollections).values(
        input.subclassIds.map((subclassId) => ({
          collectionId: input.id,
          subclassId,
        }))
      );
    }
  }

  const collectionResult = await db
    .select()
    .from(collections)
    .where(eq(collections.id, input.id))
    .limit(1);

  return loadCollectionOverview(db, collectionResult[0], user);
};

export const deleteCollection = async (input: {
  id: string;
  discordId: string;
}): Promise<boolean> => {
  if (!isValidUUID(input.id)) return false;

  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, input.discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const result = await db
    .delete(collections)
    .where(
      and(
        eq(collections.id, input.id),
        eq(collections.creatorId, userResult[0].id)
      )
    );

  return result.rowsAffected > 0;
};

export const deleteMonsterFromCollection = async (
  collectionId: string,
  monsterId: string,
  discordId: string
): Promise<boolean> => {
  if (!isValidUUID(collectionId) || !isValidUUID(monsterId)) return false;

  const db = getDatabase();

  // Verify ownership
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return false;

  const collectionCheck = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(
        eq(collections.id, collectionId),
        eq(collections.creatorId, userResult[0].id)
      )
    )
    .limit(1);

  if (collectionCheck.length === 0) return false;

  const result = await db
    .delete(monstersCollections)
    .where(
      and(
        eq(monstersCollections.collectionId, collectionId),
        eq(monstersCollections.monsterId, monsterId)
      )
    );

  return result.rowsAffected > 0;
};

export const getCollection = async (
  id: string,
  discordId?: string
): Promise<Collection | null> => {
  if (!isValidUUID(id)) return null;

  const db = getDatabase();

  // If discordId provided, include private collections for that user
  if (discordId) {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);

    if (userResult.length > 0) {
      // Try to get as owner first
      const ownedCollection = await db
        .select({ collection: collections, creator: users })
        .from(collections)
        .innerJoin(users, eq(collections.creatorId, users.id))
        .where(
          and(
            eq(collections.id, id),
            eq(collections.creatorId, userResult[0].id)
          )
        )
        .limit(1);

      if (ownedCollection.length > 0) {
        return loadCollectionFull(
          db,
          ownedCollection[0].collection,
          ownedCollection[0].creator
        );
      }
    }
  }

  // Fall back to public collection
  return getPublicCollectionByIdWithMonstersItems(id);
};

export const addMonsterToCollection = async (input: {
  monsterId: string;
  collectionId: string;
}): Promise<void> => {
  const db = getDatabase();

  // Check if already exists
  const existing = await db
    .select()
    .from(monstersCollections)
    .where(
      and(
        eq(monstersCollections.collectionId, input.collectionId),
        eq(monstersCollections.monsterId, input.monsterId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(monstersCollections).values({
      collectionId: input.collectionId,
      monsterId: input.monsterId,
    });
  }
};

export const addItemToCollection = async (input: {
  itemId: string;
  collectionId: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(itemsCollections)
    .where(
      and(
        eq(itemsCollections.collectionId, input.collectionId),
        eq(itemsCollections.itemId, input.itemId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(itemsCollections).values({
      collectionId: input.collectionId,
      itemId: input.itemId,
    });
  }
};

export const addSpellSchoolToCollection = async (input: {
  spellSchoolId: string;
  collectionId: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(spellSchoolsCollections)
    .where(
      and(
        eq(spellSchoolsCollections.collectionId, input.collectionId),
        eq(spellSchoolsCollections.spellSchoolId, input.spellSchoolId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(spellSchoolsCollections).values({
      collectionId: input.collectionId,
      spellSchoolId: input.spellSchoolId,
    });
  }
};

export const addCompanionToCollection = async (input: {
  companionId: string;
  collectionId: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(companionsCollections)
    .where(
      and(
        eq(companionsCollections.collectionId, input.collectionId),
        eq(companionsCollections.companionId, input.companionId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(companionsCollections).values({
      collectionId: input.collectionId,
      companionId: input.companionId,
    });
  }
};

export const addAncestryToCollection = async (input: {
  ancestryId: string;
  collectionId: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(ancestriesCollections)
    .where(
      and(
        eq(ancestriesCollections.collectionId, input.collectionId),
        eq(ancestriesCollections.ancestryId, input.ancestryId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(ancestriesCollections).values({
      collectionId: input.collectionId,
      ancestryId: input.ancestryId,
    });
  }
};

export const addBackgroundToCollection = async (input: {
  backgroundId: string;
  collectionId: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(backgroundsCollections)
    .where(
      and(
        eq(backgroundsCollections.collectionId, input.collectionId),
        eq(backgroundsCollections.backgroundId, input.backgroundId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(backgroundsCollections).values({
      collectionId: input.collectionId,
      backgroundId: input.backgroundId,
    });
  }
};

export const addSubclassToCollection = async (input: {
  subclassId: string;
  collectionId: string;
}): Promise<void> => {
  const db = getDatabase();

  const existing = await db
    .select()
    .from(subclassesCollections)
    .where(
      and(
        eq(subclassesCollections.collectionId, input.collectionId),
        eq(subclassesCollections.subclassId, input.subclassId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(subclassesCollections).values({
      collectionId: input.collectionId,
      subclassId: input.subclassId,
    });
  }
};

export const listPublicCollectionsHavingMonstersForUser = async (
  creatorId: string
): Promise<CollectionOverview[]> => {
  const db = getDatabase();

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, creatorId))
    .limit(1);

  if (userResult.length === 0) return [];
  const user = userResult[0];

  const collectionRows = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.creatorId, creatorId),
        eq(collections.visibility, "public")
      )
    )
    .orderBy(asc(collections.name));

  if (collectionRows.length === 0) return [];

  const results: CollectionOverview[] = [];
  for (const c of collectionRows) {
    const overview = await loadCollectionOverview(db, c, user);
    if (overview.monsters.length > 0) {
      results.push(overview);
    }
  }

  return results;
};

export const findSpellSchoolCollections = async (
  schoolId: string
): Promise<CollectionOverview[]> => {
  if (!isValidUUID(schoolId)) return [];

  const db = getDatabase();

  const collectionLinks = await db
    .select({ collectionId: spellSchoolsCollections.collectionId })
    .from(spellSchoolsCollections)
    .where(eq(spellSchoolsCollections.spellSchoolId, schoolId));

  if (collectionLinks.length === 0) return [];

  const collectionIds = collectionLinks.map((l) => l.collectionId);

  const collectionRows = await db
    .select({ collection: collections, creator: users })
    .from(collections)
    .innerJoin(users, eq(collections.creatorId, users.id))
    .where(
      and(
        inArray(collections.id, collectionIds),
        eq(collections.visibility, "public")
      )
    )
    .orderBy(asc(collections.name));

  const results: CollectionOverview[] = [];
  for (const row of collectionRows) {
    const overview = await loadCollectionOverview(
      db,
      row.collection,
      row.creator
    );
    results.push(overview);
  }

  return results;
};

// Helper function for overview (MonsterMini)
async function loadCollectionOverview(
  db: ReturnType<typeof getDatabase>,
  collection: CollectionRow,
  creator: UserRow
): Promise<CollectionOverview> {
  const monsterLinks = await db
    .select({ monster: monsters })
    .from(monstersCollections)
    .innerJoin(monsters, eq(monstersCollections.monsterId, monsters.id))
    .where(eq(monstersCollections.collectionId, collection.id));

  const itemLinks = await db
    .select({ item: items })
    .from(itemsCollections)
    .innerJoin(items, eq(itemsCollections.itemId, items.id))
    .where(eq(itemsCollections.collectionId, collection.id));

  const schoolLinks = await db
    .select({ school: spellSchools })
    .from(spellSchoolsCollections)
    .innerJoin(
      spellSchools,
      eq(spellSchoolsCollections.spellSchoolId, spellSchools.id)
    )
    .where(eq(spellSchoolsCollections.collectionId, collection.id));

  const companionLinks = await db
    .select({ companion: companions })
    .from(companionsCollections)
    .innerJoin(companions, eq(companionsCollections.companionId, companions.id))
    .where(eq(companionsCollections.collectionId, collection.id));

  const ancestryLinks = await db
    .select({ ancestry: ancestries })
    .from(ancestriesCollections)
    .innerJoin(ancestries, eq(ancestriesCollections.ancestryId, ancestries.id))
    .where(eq(ancestriesCollections.collectionId, collection.id));

  const backgroundLinks = await db
    .select({ background: backgrounds })
    .from(backgroundsCollections)
    .innerJoin(
      backgrounds,
      eq(backgroundsCollections.backgroundId, backgrounds.id)
    )
    .where(eq(backgroundsCollections.collectionId, collection.id));

  const subclassLinks = await db
    .select({ subclass: subclasses })
    .from(subclassesCollections)
    .innerJoin(subclasses, eq(subclassesCollections.subclassId, subclasses.id))
    .where(eq(subclassesCollections.collectionId, collection.id));

  const collectionMonsters = monsterLinks.map((l) => l.monster);
  const collectionItems = itemLinks.map((l) => l.item);
  const collectionSchools = schoolLinks.map((l) => l.school);

  const legendaryCount = collectionMonsters.filter((m) => m.legendary).length;
  const standardCount = collectionMonsters.filter(
    (m) => !m.legendary && !m.minion
  ).length;

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description || undefined,
    visibility: collection.visibility as "public" | "private",
    creator: toUser(creator),
    monsters: collectionMonsters.map(toMonsterMini),
    items: collectionItems.map(toItemMini),
    itemCount: collectionItems.length,
    companions: companionLinks.map((l) => toCompanionMini(l.companion)),
    ancestries: ancestryLinks.map((l) => toAncestryMini(l.ancestry)),
    backgrounds: backgroundLinks.map((l) => toBackgroundMini(l.background)),
    subclasses: subclassLinks.map((l) => toSubclassMini(l.subclass)),
    spellSchools: collectionSchools.map(toSpellSchoolMini),
    legendaryCount,
    standardCount,
    createdAt: collection.createdAt
      ? new Date(collection.createdAt)
      : undefined,
  };
}

// Helper function for full collection (full Monster data)
async function loadCollectionFull(
  db: ReturnType<typeof getDatabase>,
  collection: CollectionRow,
  creator: UserRow
): Promise<Collection> {
  const monsterLinks = await db
    .select({ monsterId: monstersCollections.monsterId })
    .from(monstersCollections)
    .where(eq(monstersCollections.collectionId, collection.id));

  const itemLinks = await db
    .select({ itemId: itemsCollections.itemId })
    .from(itemsCollections)
    .where(eq(itemsCollections.collectionId, collection.id));

  const schoolLinks = await db
    .select({ schoolId: spellSchoolsCollections.spellSchoolId })
    .from(spellSchoolsCollections)
    .where(eq(spellSchoolsCollections.collectionId, collection.id));

  const companionLinks = await db
    .select({ companionId: companionsCollections.companionId })
    .from(companionsCollections)
    .where(eq(companionsCollections.collectionId, collection.id));

  const ancestryLinks = await db
    .select({ ancestryId: ancestriesCollections.ancestryId })
    .from(ancestriesCollections)
    .where(eq(ancestriesCollections.collectionId, collection.id));

  const backgroundLinks = await db
    .select({ backgroundId: backgroundsCollections.backgroundId })
    .from(backgroundsCollections)
    .where(eq(backgroundsCollections.collectionId, collection.id));

  const subclassLinks = await db
    .select({ subclassId: subclassesCollections.subclassId })
    .from(subclassesCollections)
    .where(eq(subclassesCollections.collectionId, collection.id));

  const monsterIds = monsterLinks.map((l) => l.monsterId);
  const itemIds = itemLinks.map((l) => l.itemId);
  const schoolIds = schoolLinks.map((l) => l.schoolId);
  const companionIds = companionLinks.map((l) => l.companionId);
  const ancestryIds = ancestryLinks.map((l) => l.ancestryId);
  const backgroundIds = backgroundLinks.map((l) => l.backgroundId);
  const subclassIds = subclassLinks.map((l) => l.subclassId);

  const collectionMonsters = await findMonstersByIds(monsterIds);
  const collectionItems = await findItemsByIds(itemIds);
  const collectionSchools = await findSpellSchoolsByIds(schoolIds);
  const collectionCompanions = await findCompanionsByIds(companionIds);
  const collectionAncestries = await findAncestriesByIds(ancestryIds);
  const collectionBackgrounds = await findBackgroundsByIds(backgroundIds);
  const collectionSubclasses = await findSubclassesByIds(subclassIds);

  const legendaryCount = collectionMonsters.filter((m) => m.legendary).length;
  const standardCount = collectionMonsters.filter(
    (m) => !m.legendary && !m.minion
  ).length;

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description || undefined,
    visibility: collection.visibility as "public" | "private",
    creator: toUser(creator),
    monsters: collectionMonsters,
    items: collectionItems,
    itemCount: collectionItems.length,
    companions: collectionCompanions,
    ancestries: collectionAncestries,
    backgrounds: collectionBackgrounds,
    subclasses: collectionSubclasses,
    spellSchools: collectionSchools,
    legendaryCount,
    standardCount,
    createdAt: collection.createdAt
      ? new Date(collection.createdAt)
      : undefined,
  };
}
