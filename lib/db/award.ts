import { and, asc, eq } from "drizzle-orm";
import type { Award as AwardType } from "@/lib/types";
import { getDatabase } from "./drizzle";
import {
  type AwardRow,
  ancestriesAwards,
  awards,
  backgroundsAwards,
  companionsAwards,
  itemsAwards,
  monstersAwards,
  spellSchoolsAwards,
  subclassesAwards,
} from "./schema";

const toAward = (row: AwardRow): AwardType => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  abbreviation: row.abbreviation,
  description: row.description,
  url: row.url,
  color: row.color,
  icon: row.icon,
  createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
  updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
});

export async function getAllAwards(): Promise<AwardType[]> {
  const db = getDatabase();
  const rows = await db.select().from(awards).orderBy(asc(awards.name));
  return rows.map(toAward);
}

export async function getAwardById(id: string): Promise<AwardType | null> {
  const db = getDatabase();
  const result = await db
    .select()
    .from(awards)
    .where(eq(awards.id, id))
    .limit(1);
  return result[0] ? toAward(result[0]) : null;
}

export async function getAwardBySlug(slug: string): Promise<AwardType | null> {
  const db = getDatabase();
  const result = await db
    .select()
    .from(awards)
    .where(eq(awards.slug, slug))
    .limit(1);
  return result[0] ? toAward(result[0]) : null;
}

export async function createAward(data: {
  name: string;
  abbreviation: string;
  description: string;
  slug: string;
  url: string;
  color: string;
  icon: string;
}) {
  const db = getDatabase();
  const result = await db.insert(awards).values(data).returning();
  return result[0];
}

export async function updateAward(
  id: string,
  data: {
    name: string;
    abbreviation: string;
    description: string;
    slug: string;
    url: string;
    color: string;
    icon: string;
  }
) {
  const db = getDatabase();
  const result = await db
    .update(awards)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(awards.id, id))
    .returning();
  return result[0];
}

export async function deleteAward(id: string) {
  const db = getDatabase();
  const result = await db.delete(awards).where(eq(awards.id, id));
  return result.rowsAffected > 0;
}

export interface AwardWithCounts extends AwardType {
  monsterCount: number;
  itemCount: number;
  companionCount: number;
  subclassCount: number;
  schoolCount: number;
  ancestryCount: number;
  backgroundCount: number;
}

export async function getAwardBySlugWithCounts(
  slug: string
): Promise<AwardWithCounts | null> {
  const db = getDatabase();
  const result = await db
    .select()
    .from(awards)
    .where(eq(awards.slug, slug))
    .limit(1);
  const row = result[0];
  if (!row) return null;

  return {
    ...toAward(row),
    monsterCount: 0,
    itemCount: 0,
    companionCount: 0,
    subclassCount: 0,
    schoolCount: 0,
    ancestryCount: 0,
    backgroundCount: 0,
  };
}

export async function getMonstersForAward(_awardId: string) {
  return [];
}

export async function getItemsForAward(_awardId: string) {
  return [];
}

export async function getCompanionsForAward(_awardId: string) {
  return [];
}

export async function getSubclassesForAward(_awardId: string) {
  return [];
}

export async function getSchoolsForAward(_awardId: string) {
  return [];
}

export async function getAncestriesForAward(_awardId: string) {
  return [];
}

export async function getBackgroundsForAward(_awardId: string) {
  return [];
}

export async function getAwardsWithCounts(): Promise<AwardWithCounts[]> {
  return [];
}

interface AwardRef {
  award: AwardRow;
}

interface EntityWithAwards {
  id: string;
  name: string;
}

interface MonsterWithAwards extends EntityWithAwards {
  monsterAwards: AwardRef[];
}

interface ItemWithAwards extends EntityWithAwards {
  itemAwards: AwardRef[];
}

interface CompanionWithAwards extends EntityWithAwards {
  companionAwards: AwardRef[];
}

interface SubclassWithAwards extends EntityWithAwards {
  subclassAwards: AwardRef[];
}

interface SchoolWithAwards extends EntityWithAwards {
  schoolAwards: AwardRef[];
}

interface AncestryWithAwards extends EntityWithAwards {
  ancestryAwards: AwardRef[];
}

interface BackgroundWithAwards extends EntityWithAwards {
  backgroundAwards: AwardRef[];
}

export interface EntitiesWithAwards {
  monsters: MonsterWithAwards[];
  items: ItemWithAwards[];
  companions: CompanionWithAwards[];
  subclasses: SubclassWithAwards[];
  schools: SchoolWithAwards[];
  ancestries: AncestryWithAwards[];
  backgrounds: BackgroundWithAwards[];
}

export async function getEntitiesWithAwards(): Promise<EntitiesWithAwards> {
  return {
    monsters: [],
    items: [],
    companions: [],
    subclasses: [],
    schools: [],
    ancestries: [],
    backgrounds: [],
  };
}

import type { Ancestry } from "@/lib/services/ancestries/types";
import type { Background } from "@/lib/services/backgrounds/types";
import type { Item } from "@/lib/services/items/types";
import type { Monster } from "@/lib/services/monsters/types";
import type { Companion, SpellSchool, Subclass } from "@/lib/types";

export interface EntitiesForAward {
  monsters: Monster[];
  items: Item[];
  companions: Companion[];
  subclasses: Subclass[];
  schools: SpellSchool[];
  ancestries: Ancestry[];
  backgrounds: Background[];
}

export async function getEntitiesForAward(
  _awardId: string
): Promise<EntitiesForAward> {
  return {
    monsters: [],
    items: [],
    companions: [],
    subclasses: [],
    schools: [],
    ancestries: [],
    backgrounds: [],
  };
}

export async function addAwardToMonster(awardId: string, monsterId: string) {
  const db = getDatabase();
  await db
    .insert(monstersAwards)
    .values({ awardId, monsterId })
    .onConflictDoNothing();
}

export async function addAwardToItem(awardId: string, itemId: string) {
  const db = getDatabase();
  await db
    .insert(itemsAwards)
    .values({ awardId, itemId })
    .onConflictDoNothing();
}

export async function addAwardToCompanion(
  awardId: string,
  companionId: string
) {
  const db = getDatabase();
  await db
    .insert(companionsAwards)
    .values({ awardId, companionId })
    .onConflictDoNothing();
}

export async function addAwardToSubclass(awardId: string, subclassId: string) {
  const db = getDatabase();
  await db
    .insert(subclassesAwards)
    .values({ awardId, subclassId })
    .onConflictDoNothing();
}

export async function addAwardToSchool(awardId: string, schoolId: string) {
  const db = getDatabase();
  await db
    .insert(spellSchoolsAwards)
    .values({ awardId, schoolId })
    .onConflictDoNothing();
}

export async function addAwardToAncestry(awardId: string, ancestryId: string) {
  const db = getDatabase();
  await db
    .insert(ancestriesAwards)
    .values({ awardId, ancestryId })
    .onConflictDoNothing();
}

export async function addAwardToBackground(
  awardId: string,
  backgroundId: string
) {
  const db = getDatabase();
  await db
    .insert(backgroundsAwards)
    .values({ awardId, backgroundId })
    .onConflictDoNothing();
}

export async function removeAwardFromMonster(
  awardId: string,
  monsterId: string
) {
  const db = getDatabase();
  await db
    .delete(monstersAwards)
    .where(
      and(
        eq(monstersAwards.awardId, awardId),
        eq(monstersAwards.monsterId, monsterId)
      )
    );
}

export async function removeAwardFromItem(awardId: string, itemId: string) {
  const db = getDatabase();
  await db
    .delete(itemsAwards)
    .where(
      and(eq(itemsAwards.awardId, awardId), eq(itemsAwards.itemId, itemId))
    );
}

export async function removeAwardFromCompanion(
  awardId: string,
  companionId: string
) {
  const db = getDatabase();
  await db
    .delete(companionsAwards)
    .where(
      and(
        eq(companionsAwards.awardId, awardId),
        eq(companionsAwards.companionId, companionId)
      )
    );
}

export async function removeAwardFromSubclass(
  awardId: string,
  subclassId: string
) {
  const db = getDatabase();
  await db
    .delete(subclassesAwards)
    .where(
      and(
        eq(subclassesAwards.awardId, awardId),
        eq(subclassesAwards.subclassId, subclassId)
      )
    );
}

export async function removeAwardFromSchool(awardId: string, schoolId: string) {
  const db = getDatabase();
  await db
    .delete(spellSchoolsAwards)
    .where(
      and(
        eq(spellSchoolsAwards.awardId, awardId),
        eq(spellSchoolsAwards.schoolId, schoolId)
      )
    );
}

export async function removeAwardFromAncestry(
  awardId: string,
  ancestryId: string
) {
  const db = getDatabase();
  await db
    .delete(ancestriesAwards)
    .where(
      and(
        eq(ancestriesAwards.awardId, awardId),
        eq(ancestriesAwards.ancestryId, ancestryId)
      )
    );
}

export async function removeAwardFromBackground(
  awardId: string,
  backgroundId: string
) {
  const db = getDatabase();
  await db
    .delete(backgroundsAwards)
    .where(
      and(
        eq(backgroundsAwards.awardId, awardId),
        eq(backgroundsAwards.backgroundId, backgroundId)
      )
    );
}

export async function searchEntities(_entityType: string, _query: string) {
  return [];
}
