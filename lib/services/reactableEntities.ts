import { eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  ancestries,
  backgrounds,
  classes,
  companions,
  items,
  monsters,
  type ReactableEntityType,
  spellSchools,
  subclasses,
} from "@/lib/db/schema";
import {
  getAncestryUrl,
  getBackgroundUrl,
  getClassUrl,
  getCompanionUrl,
  getItemUrl,
  getMonsterUrl,
  getSpellSchoolUrl,
  getSubclassUrl,
} from "@/lib/utils/url";

export interface ReactableEntityInfo {
  name: string;
  url: string;
}

type ResolveMany = (ids: string[]) => Promise<Map<string, ReactableEntityInfo>>;

const RESOLVERS: Record<ReactableEntityType, ResolveMany> = {
  monster: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({ id: monsters.id, name: monsters.name })
      .from(monsters)
      .where(inArray(monsters.id, ids));
    return new Map(
      rows.map((row) => [row.id, { name: row.name, url: getMonsterUrl(row) }])
    );
  },
  item: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({ id: items.id, name: items.name })
      .from(items)
      .where(inArray(items.id, ids));
    return new Map(
      rows.map((row) => [row.id, { name: row.name, url: getItemUrl(row) }])
    );
  },
  companion: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({ id: companions.id, name: companions.name })
      .from(companions)
      .where(inArray(companions.id, ids));
    return new Map(
      rows.map((row) => [row.id, { name: row.name, url: getCompanionUrl(row) }])
    );
  },
  subclass: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({
        id: subclasses.id,
        name: subclasses.name,
        namePreface: subclasses.namePreface,
      })
      .from(subclasses)
      .where(inArray(subclasses.id, ids));
    return new Map(
      rows.map((row) => [
        row.id,
        {
          name: row.name,
          url: getSubclassUrl({
            ...row,
            namePreface: row.namePreface ?? undefined,
          }),
        },
      ])
    );
  },
  class: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(inArray(classes.id, ids));
    return new Map(
      rows.map((row) => [row.id, { name: row.name, url: getClassUrl(row) }])
    );
  },
  spellSchool: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({ id: spellSchools.id, name: spellSchools.name })
      .from(spellSchools)
      .where(inArray(spellSchools.id, ids));
    return new Map(
      rows.map((row) => [
        row.id,
        { name: row.name, url: getSpellSchoolUrl(row) },
      ])
    );
  },
  background: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({ id: backgrounds.id, name: backgrounds.name })
      .from(backgrounds)
      .where(inArray(backgrounds.id, ids));
    return new Map(
      rows.map((row) => [
        row.id,
        { name: row.name, url: getBackgroundUrl(row) },
      ])
    );
  },
  ancestry: async (ids) => {
    const db = getDatabase();
    const rows = await db
      .select({ id: ancestries.id, name: ancestries.name })
      .from(ancestries)
      .where(inArray(ancestries.id, ids));
    return new Map(
      rows.map((row) => [row.id, { name: row.name, url: getAncestryUrl(row) }])
    );
  },
};

export const ENTITY_TYPE_LABELS: Record<ReactableEntityType, string> = {
  monster: "Monster",
  item: "Item",
  companion: "Companion",
  subclass: "Subclass",
  class: "Class",
  spellSchool: "Spell School",
  background: "Background",
  ancestry: "Ancestry",
};

export async function resolveEntities(
  entityType: ReactableEntityType,
  ids: string[]
): Promise<Map<string, ReactableEntityInfo>> {
  if (ids.length === 0) return new Map();
  return RESOLVERS[entityType](ids);
}

// Every reactable entity denormalizes thumbs_up count onto its own
// `like_count` column to drive "Most Liked" sorting.
export async function syncLikeCount(
  entityType: ReactableEntityType,
  entityId: string,
  thumbsUpCount: number
): Promise<void> {
  const db = getDatabase();
  switch (entityType) {
    case "monster":
      await db
        .update(monsters)
        .set({ likeCount: thumbsUpCount })
        .where(eq(monsters.id, entityId));
      return;
    case "item":
      await db
        .update(items)
        .set({ likeCount: thumbsUpCount })
        .where(eq(items.id, entityId));
      return;
    case "companion":
      await db
        .update(companions)
        .set({ likeCount: thumbsUpCount })
        .where(eq(companions.id, entityId));
      return;
    case "subclass":
      await db
        .update(subclasses)
        .set({ likeCount: thumbsUpCount })
        .where(eq(subclasses.id, entityId));
      return;
    case "class":
      await db
        .update(classes)
        .set({ likeCount: thumbsUpCount })
        .where(eq(classes.id, entityId));
      return;
    case "spellSchool":
      await db
        .update(spellSchools)
        .set({ likeCount: thumbsUpCount })
        .where(eq(spellSchools.id, entityId));
      return;
    case "background":
      await db
        .update(backgrounds)
        .set({ likeCount: thumbsUpCount })
        .where(eq(backgrounds.id, entityId));
      return;
    case "ancestry":
      await db
        .update(ancestries)
        .set({ likeCount: thumbsUpCount })
        .where(eq(ancestries.id, entityId));
      return;
  }
}
