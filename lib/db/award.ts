import { and, asc, count, eq, inArray, like } from "drizzle-orm";
import type {
  Ancestry,
  AncestryAbility,
  AncestrySize,
} from "@/lib/services/ancestries/types";
import type { Background } from "@/lib/services/backgrounds/types";
import type { Item } from "@/lib/services/items/types";
import type { Monster } from "@/lib/services/monsters/types";
import type {
  Award as AwardType,
  Companion,
  SpellSchool,
  Subclass,
} from "@/lib/types";
import { toItem } from "../services/items/converters";
import { toMonster } from "../services/monsters/converters";
import { toCompanion, toSpellSchool, toSubclass, toUser } from "./converters";
import { getDatabase } from "./drizzle";
import {
  type AwardRow,
  ancestries,
  ancestriesAwards,
  awards,
  backgrounds,
  backgroundsAwards,
  companions,
  companionsAwards,
  type FamilyRow,
  families,
  items,
  itemsAwards,
  monsters,
  monstersAwards,
  monstersFamilies,
  type SpellRow,
  type SubclassAbilityRow,
  sources,
  spellSchools,
  spellSchoolsAwards,
  spells,
  subclassAbilities,
  subclasses,
  subclassesAwards,
  type UserRow,
  users,
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

  const [
    monsterCounts,
    itemCounts,
    companionCounts,
    subclassCounts,
    schoolCounts,
    ancestryCounts,
    backgroundCounts,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(monstersAwards)
      .where(eq(monstersAwards.awardId, row.id)),
    db
      .select({ count: count() })
      .from(itemsAwards)
      .where(eq(itemsAwards.awardId, row.id)),
    db
      .select({ count: count() })
      .from(companionsAwards)
      .where(eq(companionsAwards.awardId, row.id)),
    db
      .select({ count: count() })
      .from(subclassesAwards)
      .where(eq(subclassesAwards.awardId, row.id)),
    db
      .select({ count: count() })
      .from(spellSchoolsAwards)
      .where(eq(spellSchoolsAwards.awardId, row.id)),
    db
      .select({ count: count() })
      .from(ancestriesAwards)
      .where(eq(ancestriesAwards.awardId, row.id)),
    db
      .select({ count: count() })
      .from(backgroundsAwards)
      .where(eq(backgroundsAwards.awardId, row.id)),
  ]);

  return {
    ...toAward(row),
    monsterCount: monsterCounts[0]?.count || 0,
    itemCount: itemCounts[0]?.count || 0,
    companionCount: companionCounts[0]?.count || 0,
    subclassCount: subclassCounts[0]?.count || 0,
    schoolCount: schoolCounts[0]?.count || 0,
    ancestryCount: ancestryCounts[0]?.count || 0,
    backgroundCount: backgroundCounts[0]?.count || 0,
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
  const db = getDatabase();

  const awardRows = await db.select().from(awards).orderBy(asc(awards.name));
  if (awardRows.length === 0) return [];

  const awardIds = awardRows.map((a) => a.id);

  const [
    monsterCounts,
    itemCounts,
    companionCounts,
    subclassCounts,
    schoolCounts,
    ancestryCounts,
    backgroundCounts,
  ] = await Promise.all([
    db
      .select({ awardId: monstersAwards.awardId, count: count() })
      .from(monstersAwards)
      .where(inArray(monstersAwards.awardId, awardIds))
      .groupBy(monstersAwards.awardId),
    db
      .select({ awardId: itemsAwards.awardId, count: count() })
      .from(itemsAwards)
      .where(inArray(itemsAwards.awardId, awardIds))
      .groupBy(itemsAwards.awardId),
    db
      .select({ awardId: companionsAwards.awardId, count: count() })
      .from(companionsAwards)
      .where(inArray(companionsAwards.awardId, awardIds))
      .groupBy(companionsAwards.awardId),
    db
      .select({ awardId: subclassesAwards.awardId, count: count() })
      .from(subclassesAwards)
      .where(inArray(subclassesAwards.awardId, awardIds))
      .groupBy(subclassesAwards.awardId),
    db
      .select({ awardId: spellSchoolsAwards.awardId, count: count() })
      .from(spellSchoolsAwards)
      .where(inArray(spellSchoolsAwards.awardId, awardIds))
      .groupBy(spellSchoolsAwards.awardId),
    db
      .select({ awardId: ancestriesAwards.awardId, count: count() })
      .from(ancestriesAwards)
      .where(inArray(ancestriesAwards.awardId, awardIds))
      .groupBy(ancestriesAwards.awardId),
    db
      .select({ awardId: backgroundsAwards.awardId, count: count() })
      .from(backgroundsAwards)
      .where(inArray(backgroundsAwards.awardId, awardIds))
      .groupBy(backgroundsAwards.awardId),
  ]);

  const monsterCountMap = new Map(
    monsterCounts.map((c) => [c.awardId, c.count])
  );
  const itemCountMap = new Map(itemCounts.map((c) => [c.awardId, c.count]));
  const companionCountMap = new Map(
    companionCounts.map((c) => [c.awardId, c.count])
  );
  const subclassCountMap = new Map(
    subclassCounts.map((c) => [c.awardId, c.count])
  );
  const schoolCountMap = new Map(schoolCounts.map((c) => [c.awardId, c.count]));
  const ancestryCountMap = new Map(
    ancestryCounts.map((c) => [c.awardId, c.count])
  );
  const backgroundCountMap = new Map(
    backgroundCounts.map((c) => [c.awardId, c.count])
  );

  return awardRows.map((award) => ({
    ...toAward(award),
    monsterCount: monsterCountMap.get(award.id) || 0,
    itemCount: itemCountMap.get(award.id) || 0,
    companionCount: companionCountMap.get(award.id) || 0,
    subclassCount: subclassCountMap.get(award.id) || 0,
    schoolCount: schoolCountMap.get(award.id) || 0,
    ancestryCount: ancestryCountMap.get(award.id) || 0,
    backgroundCount: backgroundCountMap.get(award.id) || 0,
  }));
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
  const db = getDatabase();

  const [
    monsterAwardLinks,
    itemAwardLinks,
    companionAwardLinks,
    subclassAwardLinks,
    schoolAwardLinks,
    ancestryAwardLinks,
    backgroundAwardLinks,
  ] = await Promise.all([
    db
      .select({
        entityId: monstersAwards.monsterId,
        awardId: monstersAwards.awardId,
      })
      .from(monstersAwards),
    db
      .select({ entityId: itemsAwards.itemId, awardId: itemsAwards.awardId })
      .from(itemsAwards),
    db
      .select({
        entityId: companionsAwards.companionId,
        awardId: companionsAwards.awardId,
      })
      .from(companionsAwards),
    db
      .select({
        entityId: subclassesAwards.subclassId,
        awardId: subclassesAwards.awardId,
      })
      .from(subclassesAwards),
    db
      .select({
        entityId: spellSchoolsAwards.schoolId,
        awardId: spellSchoolsAwards.awardId,
      })
      .from(spellSchoolsAwards),
    db
      .select({
        entityId: ancestriesAwards.ancestryId,
        awardId: ancestriesAwards.awardId,
      })
      .from(ancestriesAwards),
    db
      .select({
        entityId: backgroundsAwards.backgroundId,
        awardId: backgroundsAwards.awardId,
      })
      .from(backgroundsAwards),
  ]);

  const allAwardIds = [
    ...new Set([
      ...monsterAwardLinks.map((l) => l.awardId),
      ...itemAwardLinks.map((l) => l.awardId),
      ...companionAwardLinks.map((l) => l.awardId),
      ...subclassAwardLinks.map((l) => l.awardId),
      ...schoolAwardLinks.map((l) => l.awardId),
      ...ancestryAwardLinks.map((l) => l.awardId),
      ...backgroundAwardLinks.map((l) => l.awardId),
    ]),
  ];

  const awardRowsResult =
    allAwardIds.length > 0
      ? await db.select().from(awards).where(inArray(awards.id, allAwardIds))
      : [];
  const awardMap = new Map(awardRowsResult.map((a) => [a.id, a]));

  const monsterIds = [...new Set(monsterAwardLinks.map((l) => l.entityId))];
  const itemIds = [...new Set(itemAwardLinks.map((l) => l.entityId))];
  const companionIds = [...new Set(companionAwardLinks.map((l) => l.entityId))];
  const subclassIds = [...new Set(subclassAwardLinks.map((l) => l.entityId))];
  const schoolIds = [...new Set(schoolAwardLinks.map((l) => l.entityId))];
  const ancestryIds = [...new Set(ancestryAwardLinks.map((l) => l.entityId))];
  const backgroundIds = [
    ...new Set(backgroundAwardLinks.map((l) => l.entityId)),
  ];

  const [
    monsterRows,
    itemRows,
    companionRows,
    subclassRows,
    schoolRows,
    ancestryRows,
    backgroundRows,
  ] = await Promise.all([
    monsterIds.length > 0
      ? db
          .select()
          .from(monsters)
          .where(inArray(monsters.id, monsterIds))
          .orderBy(asc(monsters.name))
      : [],
    itemIds.length > 0
      ? db
          .select()
          .from(items)
          .where(inArray(items.id, itemIds))
          .orderBy(asc(items.name))
      : [],
    companionIds.length > 0
      ? db
          .select()
          .from(companions)
          .where(inArray(companions.id, companionIds))
          .orderBy(asc(companions.name))
      : [],
    subclassIds.length > 0
      ? db
          .select()
          .from(subclasses)
          .where(inArray(subclasses.id, subclassIds))
          .orderBy(asc(subclasses.name))
      : [],
    schoolIds.length > 0
      ? db
          .select()
          .from(spellSchools)
          .where(inArray(spellSchools.id, schoolIds))
          .orderBy(asc(spellSchools.name))
      : [],
    ancestryIds.length > 0
      ? db
          .select()
          .from(ancestries)
          .where(inArray(ancestries.id, ancestryIds))
          .orderBy(asc(ancestries.name))
      : [],
    backgroundIds.length > 0
      ? db
          .select()
          .from(backgrounds)
          .where(inArray(backgrounds.id, backgroundIds))
          .orderBy(asc(backgrounds.name))
      : [],
  ]);

  const groupAwards = <T extends { entityId: string; awardId: string }>(
    links: T[]
  ) => {
    const map = new Map<string, AwardRow[]>();
    for (const link of links) {
      const award = awardMap.get(link.awardId);
      if (award) {
        const existing = map.get(link.entityId) || [];
        existing.push(award);
        map.set(link.entityId, existing);
      }
    }
    return map;
  };

  const monsterAwardsMap = groupAwards(monsterAwardLinks);
  const itemAwardsMap = groupAwards(itemAwardLinks);
  const companionAwardsMap = groupAwards(companionAwardLinks);
  const subclassAwardsMap = groupAwards(subclassAwardLinks);
  const schoolAwardsMap = groupAwards(schoolAwardLinks);
  const ancestryAwardsMap = groupAwards(ancestryAwardLinks);
  const backgroundAwardsMap = groupAwards(backgroundAwardLinks);

  return {
    monsters: monsterRows.map((m) => ({
      ...m,
      monsterAwards: (monsterAwardsMap.get(m.id) || []).map((a) => ({
        award: a,
      })),
    })),
    items: itemRows.map((i) => ({
      ...i,
      itemAwards: (itemAwardsMap.get(i.id) || []).map((a) => ({ award: a })),
    })),
    companions: companionRows.map((c) => ({
      ...c,
      companionAwards: (companionAwardsMap.get(c.id) || []).map((a) => ({
        award: a,
      })),
    })),
    subclasses: subclassRows.map((s) => ({
      ...s,
      subclassAwards: (subclassAwardsMap.get(s.id) || []).map((a) => ({
        award: a,
      })),
    })),
    schools: schoolRows.map((s) => ({
      ...s,
      schoolAwards: (schoolAwardsMap.get(s.id) || []).map((a) => ({
        award: a,
      })),
    })),
    ancestries: ancestryRows.map((a) => ({
      ...a,
      ancestryAwards: (ancestryAwardsMap.get(a.id) || []).map((aw) => ({
        award: aw,
      })),
    })),
    backgrounds: backgroundRows.map((b) => ({
      ...b,
      backgroundAwards: (backgroundAwardsMap.get(b.id) || []).map((a) => ({
        award: a,
      })),
    })),
  };
}

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
  awardId: string
): Promise<EntitiesForAward> {
  const db = getDatabase();

  const [
    monsterAwardLinks,
    itemAwardLinks,
    companionAwardLinks,
    subclassAwardLinks,
    schoolAwardLinks,
    ancestryAwardLinks,
    backgroundAwardLinks,
  ] = await Promise.all([
    db
      .select({ monsterId: monstersAwards.monsterId })
      .from(monstersAwards)
      .where(eq(monstersAwards.awardId, awardId)),
    db
      .select({ itemId: itemsAwards.itemId })
      .from(itemsAwards)
      .where(eq(itemsAwards.awardId, awardId)),
    db
      .select({ companionId: companionsAwards.companionId })
      .from(companionsAwards)
      .where(eq(companionsAwards.awardId, awardId)),
    db
      .select({ subclassId: subclassesAwards.subclassId })
      .from(subclassesAwards)
      .where(eq(subclassesAwards.awardId, awardId)),
    db
      .select({ schoolId: spellSchoolsAwards.schoolId })
      .from(spellSchoolsAwards)
      .where(eq(spellSchoolsAwards.awardId, awardId)),
    db
      .select({ ancestryId: ancestriesAwards.ancestryId })
      .from(ancestriesAwards)
      .where(eq(ancestriesAwards.awardId, awardId)),
    db
      .select({ backgroundId: backgroundsAwards.backgroundId })
      .from(backgroundsAwards)
      .where(eq(backgroundsAwards.awardId, awardId)),
  ]);

  // Filter to public entities
  const monsterIdsRaw = monsterAwardLinks.map((l) => l.monsterId);
  const publicMonsterIds =
    monsterIdsRaw.length > 0
      ? (
          await db
            .select({ id: monsters.id })
            .from(monsters)
            .where(
              and(
                inArray(monsters.id, monsterIdsRaw),
                eq(monsters.visibility, "public")
              )
            )
        ).map((r) => r.id)
      : [];

  const itemIdsRaw = itemAwardLinks.map((l) => l.itemId);
  const publicItemIds =
    itemIdsRaw.length > 0
      ? (
          await db
            .select({ id: items.id })
            .from(items)
            .where(
              and(inArray(items.id, itemIdsRaw), eq(items.visibility, "public"))
            )
        ).map((r) => r.id)
      : [];

  const companionIdsRaw = companionAwardLinks.map((l) => l.companionId);
  const publicCompanionIds =
    companionIdsRaw.length > 0
      ? (
          await db
            .select({ id: companions.id })
            .from(companions)
            .where(
              and(
                inArray(companions.id, companionIdsRaw),
                eq(companions.visibility, "public")
              )
            )
        ).map((r) => r.id)
      : [];

  const subclassIdsRaw = subclassAwardLinks.map((l) => l.subclassId);
  const publicSubclassIds =
    subclassIdsRaw.length > 0
      ? (
          await db
            .select({ id: subclasses.id })
            .from(subclasses)
            .where(
              and(
                inArray(subclasses.id, subclassIdsRaw),
                eq(subclasses.visibility, "public")
              )
            )
        ).map((r) => r.id)
      : [];

  const schoolIdsRaw = schoolAwardLinks.map((l) => l.schoolId);
  const publicSchoolIds =
    schoolIdsRaw.length > 0
      ? (
          await db
            .select({ id: spellSchools.id })
            .from(spellSchools)
            .where(
              and(
                inArray(spellSchools.id, schoolIdsRaw),
                eq(spellSchools.visibility, "public")
              )
            )
        ).map((r) => r.id)
      : [];

  const ancestryIds = ancestryAwardLinks.map((l) => l.ancestryId);
  const backgroundIds = backgroundAwardLinks.map((l) => l.backgroundId);

  // Load full data for each entity type
  const monstersResult = await loadMonstersForAward(db, publicMonsterIds);
  const itemsResult = await loadItemsForAward(db, publicItemIds);
  const companionsResult = await loadCompanionsForAward(db, publicCompanionIds);
  const subclassesResult = await loadSubclassesForAward(db, publicSubclassIds);
  const schoolsResult = await loadSchoolsForAward(db, publicSchoolIds);
  const ancestriesResult = await loadAncestriesForAward(db, ancestryIds);
  const backgroundsResult = await loadBackgroundsForAward(db, backgroundIds);

  return {
    monsters: monstersResult,
    items: itemsResult,
    companions: companionsResult,
    subclasses: subclassesResult,
    schools: schoolsResult,
    ancestries: ancestriesResult,
    backgrounds: backgroundsResult,
  };
}

async function loadMonstersForAward(
  db: ReturnType<typeof getDatabase>,
  monsterIds: string[]
): Promise<Monster[]> {
  if (monsterIds.length === 0) return [];

  const monsterRows = await db
    .select()
    .from(monsters)
    .innerJoin(users, eq(monsters.userId, users.id))
    .leftJoin(sources, eq(monsters.sourceId, sources.id))
    .where(inArray(monsters.id, monsterIds));

  const awardRows = await db
    .select({ monsterId: monstersAwards.monsterId, award: awards })
    .from(monstersAwards)
    .innerJoin(awards, eq(monstersAwards.awardId, awards.id))
    .where(inArray(monstersAwards.monsterId, monsterIds));

  const familyRows = await db
    .select({
      monsterId: monstersFamilies.monsterId,
      family: families,
      creator: users,
    })
    .from(monstersFamilies)
    .innerJoin(families, eq(monstersFamilies.familyId, families.id))
    .innerJoin(users, eq(families.creatorId, users.id))
    .where(inArray(monstersFamilies.monsterId, monsterIds));

  const remixedFromIds = monsterRows
    .map((r) => r.monsters.remixedFromId)
    .filter((id): id is string => id !== null);

  const remixedFromMap = new Map<
    string,
    { id: string; name: string; creator: UserRow }
  >();
  if (remixedFromIds.length > 0) {
    const remixedFromRows = await db
      .select({ monster: monsters, creator: users })
      .from(monsters)
      .innerJoin(users, eq(monsters.userId, users.id))
      .where(inArray(monsters.id, remixedFromIds));

    for (const row of remixedFromRows) {
      remixedFromMap.set(row.monster.id, {
        id: row.monster.id,
        name: row.monster.name,
        creator: row.creator,
      });
    }
  }

  const awardsByMonster = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByMonster.get(row.monsterId) || [];
    existing.push(row.award);
    awardsByMonster.set(row.monsterId, existing);
  }

  const familiesByMonster = new Map<
    string,
    Array<{ family: FamilyRow; creator: UserRow }>
  >();
  for (const row of familyRows) {
    const existing = familiesByMonster.get(row.monsterId) || [];
    existing.push({ family: row.family, creator: row.creator });
    familiesByMonster.set(row.monsterId, existing);
  }

  return monsterRows
    .map((row) =>
      toMonster({
        ...row.monsters,
        creator: row.users,
        source: row.sources,
        monsterFamilies: (familiesByMonster.get(row.monsters.id) || []).map(
          (f) => ({
            family: { ...f.family, creator: f.creator },
          })
        ),
        monsterAwards: (awardsByMonster.get(row.monsters.id) || []).map(
          (a) => ({
            award: a,
          })
        ),
        remixedFrom: row.monsters.remixedFromId
          ? remixedFromMap.get(row.monsters.remixedFromId) || null
          : null,
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadItemsForAward(
  db: ReturnType<typeof getDatabase>,
  itemIds: string[]
): Promise<Item[]> {
  if (itemIds.length === 0) return [];

  const itemRows = await db
    .select()
    .from(items)
    .innerJoin(users, eq(items.userId, users.id))
    .leftJoin(sources, eq(items.sourceId, sources.id))
    .where(inArray(items.id, itemIds));

  const awardRows = await db
    .select({ itemId: itemsAwards.itemId, award: awards })
    .from(itemsAwards)
    .innerJoin(awards, eq(itemsAwards.awardId, awards.id))
    .where(inArray(itemsAwards.itemId, itemIds));

  const awardsByItem = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByItem.get(row.itemId) || [];
    existing.push(row.award);
    awardsByItem.set(row.itemId, existing);
  }

  return itemRows
    .map((row) =>
      toItem({
        ...row.items,
        creator: row.users,
        source: row.sources,
        itemAwards: (awardsByItem.get(row.items.id) || []).map((a) => ({
          award: a,
        })),
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadCompanionsForAward(
  db: ReturnType<typeof getDatabase>,
  companionIds: string[]
): Promise<Companion[]> {
  if (companionIds.length === 0) return [];

  const companionRows = await db
    .select()
    .from(companions)
    .innerJoin(users, eq(companions.userId, users.id))
    .leftJoin(sources, eq(companions.sourceId, sources.id))
    .where(inArray(companions.id, companionIds));

  const awardRows = await db
    .select({ companionId: companionsAwards.companionId, award: awards })
    .from(companionsAwards)
    .innerJoin(awards, eq(companionsAwards.awardId, awards.id))
    .where(inArray(companionsAwards.companionId, companionIds));

  const awardsByCompanion = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByCompanion.get(row.companionId) || [];
    existing.push(row.award);
    awardsByCompanion.set(row.companionId, existing);
  }

  return companionRows
    .map((row) =>
      toCompanion({
        ...row.companions,
        creator: row.users,
        source: row.sources,
        companionAwards: (awardsByCompanion.get(row.companions.id) || []).map(
          (a) => ({
            award: a,
          })
        ),
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadSubclassesForAward(
  db: ReturnType<typeof getDatabase>,
  subclassIds: string[]
): Promise<Subclass[]> {
  if (subclassIds.length === 0) return [];

  const subclassRows = await db
    .select()
    .from(subclasses)
    .innerJoin(users, eq(subclasses.userId, users.id))
    .leftJoin(sources, eq(subclasses.sourceId, sources.id))
    .where(inArray(subclasses.id, subclassIds));

  const abilityRows = await db
    .select()
    .from(subclassAbilities)
    .where(inArray(subclassAbilities.subclassId, subclassIds))
    .orderBy(asc(subclassAbilities.level), asc(subclassAbilities.orderIndex));

  const awardRows = await db
    .select({ subclassId: subclassesAwards.subclassId, award: awards })
    .from(subclassesAwards)
    .innerJoin(awards, eq(subclassesAwards.awardId, awards.id))
    .where(inArray(subclassesAwards.subclassId, subclassIds));

  const abilitiesBySubclass = new Map<string, SubclassAbilityRow[]>();
  for (const row of abilityRows) {
    const existing = abilitiesBySubclass.get(row.subclassId) || [];
    existing.push(row);
    abilitiesBySubclass.set(row.subclassId, existing);
  }

  const awardsBySubclass = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsBySubclass.get(row.subclassId) || [];
    existing.push(row.award);
    awardsBySubclass.set(row.subclassId, existing);
  }

  return subclassRows
    .map((row) =>
      toSubclass({
        ...row.subclasses,
        creator: row.users,
        source: row.sources,
        abilities: (abilitiesBySubclass.get(row.subclasses.id) || []).map(
          (a) => ({
            id: a.id,
            level: a.level,
            name: a.name,
            description: a.description,
          })
        ),
        subclassAwards: (awardsBySubclass.get(row.subclasses.id) || []).map(
          (a) => ({
            award: a,
          })
        ),
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadSchoolsForAward(
  db: ReturnType<typeof getDatabase>,
  schoolIds: string[]
): Promise<SpellSchool[]> {
  if (schoolIds.length === 0) return [];

  const schoolRows = await db
    .select()
    .from(spellSchools)
    .innerJoin(users, eq(spellSchools.userId, users.id))
    .leftJoin(sources, eq(spellSchools.sourceId, sources.id))
    .where(inArray(spellSchools.id, schoolIds));

  const spellRows = await db
    .select()
    .from(spells)
    .where(inArray(spells.schoolId, schoolIds))
    .orderBy(asc(spells.tier), asc(spells.name));

  const awardRows = await db
    .select({ schoolId: spellSchoolsAwards.schoolId, award: awards })
    .from(spellSchoolsAwards)
    .innerJoin(awards, eq(spellSchoolsAwards.awardId, awards.id))
    .where(inArray(spellSchoolsAwards.schoolId, schoolIds));

  const spellsBySchool = new Map<string, SpellRow[]>();
  for (const row of spellRows) {
    const existing = spellsBySchool.get(row.schoolId) || [];
    existing.push(row);
    spellsBySchool.set(row.schoolId, existing);
  }

  const awardsBySchool = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsBySchool.get(row.schoolId) || [];
    existing.push(row.award);
    awardsBySchool.set(row.schoolId, existing);
  }

  return schoolRows
    .map((row) =>
      toSpellSchool({
        ...row.spell_schools,
        creator: row.users,
        source: row.sources,
        spells: spellsBySchool.get(row.spell_schools.id) || [],
        schoolAwards: (awardsBySchool.get(row.spell_schools.id) || []).map(
          (a) => ({
            award: a,
          })
        ),
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadAncestriesForAward(
  db: ReturnType<typeof getDatabase>,
  ancestryIds: string[]
): Promise<Ancestry[]> {
  if (ancestryIds.length === 0) return [];

  const ancestryRows = await db
    .select()
    .from(ancestries)
    .innerJoin(users, eq(ancestries.userId, users.id))
    .leftJoin(sources, eq(ancestries.sourceId, sources.id))
    .where(inArray(ancestries.id, ancestryIds));

  const awardRows = await db
    .select({ ancestryId: ancestriesAwards.ancestryId, award: awards })
    .from(ancestriesAwards)
    .innerJoin(awards, eq(ancestriesAwards.awardId, awards.id))
    .where(inArray(ancestriesAwards.ancestryId, ancestryIds));

  const awardsByAncestry = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByAncestry.get(row.ancestryId) || [];
    existing.push(row.award);
    awardsByAncestry.set(row.ancestryId, existing);
  }

  const parseSize = (size: string): AncestrySize[] => {
    if (!size) return [];
    try {
      return JSON.parse(size) as AncestrySize[];
    } catch {
      return size ? [size as AncestrySize] : [];
    }
  };

  return ancestryRows
    .map((row) => ({
      id: row.ancestries.id,
      name: row.ancestries.name,
      size: parseSize(row.ancestries.size),
      rarity: (row.ancestries.rarity ?? "common") as "common" | "exotic",
      createdAt: row.ancestries.createdAt
        ? new Date(row.ancestries.createdAt)
        : new Date(),
      updatedAt: row.ancestries.updatedAt
        ? new Date(row.ancestries.updatedAt)
        : new Date(),
      description: row.ancestries.description,
      abilities: row.ancestries.abilities as unknown as AncestryAbility[],
      creator: toUser(row.users),
      source: row.sources
        ? {
            id: row.sources.id,
            name: row.sources.name,
            license: row.sources.license,
            link: row.sources.link,
            abbreviation: row.sources.abbreviation,
            createdAt: row.sources.createdAt
              ? new Date(row.sources.createdAt)
              : new Date(),
            updatedAt: row.sources.updatedAt
              ? new Date(row.sources.updatedAt)
              : new Date(),
          }
        : undefined,
      awards: (awardsByAncestry.get(row.ancestries.id) || []).map((a) =>
        toAward(a)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadBackgroundsForAward(
  db: ReturnType<typeof getDatabase>,
  backgroundIds: string[]
): Promise<Background[]> {
  if (backgroundIds.length === 0) return [];

  const backgroundRows = await db
    .select()
    .from(backgrounds)
    .innerJoin(users, eq(backgrounds.userId, users.id))
    .leftJoin(sources, eq(backgrounds.sourceId, sources.id))
    .where(inArray(backgrounds.id, backgroundIds));

  const awardRows = await db
    .select({ backgroundId: backgroundsAwards.backgroundId, award: awards })
    .from(backgroundsAwards)
    .innerJoin(awards, eq(backgroundsAwards.awardId, awards.id))
    .where(inArray(backgroundsAwards.backgroundId, backgroundIds));

  const awardsByBackground = new Map<string, AwardRow[]>();
  for (const row of awardRows) {
    const existing = awardsByBackground.get(row.backgroundId) || [];
    existing.push(row.award);
    awardsByBackground.set(row.backgroundId, existing);
  }

  return backgroundRows
    .map((row) => ({
      id: row.backgrounds.id,
      name: row.backgrounds.name,
      requirement: row.backgrounds.requirement || undefined,
      createdAt: row.backgrounds.createdAt
        ? new Date(row.backgrounds.createdAt)
        : new Date(),
      updatedAt: row.backgrounds.updatedAt
        ? new Date(row.backgrounds.updatedAt)
        : new Date(),
      description: row.backgrounds.description,
      creator: toUser(row.users),
      source: row.sources
        ? {
            id: row.sources.id,
            name: row.sources.name,
            license: row.sources.license,
            link: row.sources.link,
            abbreviation: row.sources.abbreviation,
            createdAt: row.sources.createdAt
              ? new Date(row.sources.createdAt)
              : new Date(),
            updatedAt: row.sources.updatedAt
              ? new Date(row.sources.updatedAt)
              : new Date(),
          }
        : undefined,
      awards: (awardsByBackground.get(row.backgrounds.id) || []).map((a) =>
        toAward(a)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
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

export async function searchEntities(entityType: string, query: string) {
  const db = getDatabase();

  switch (entityType) {
    case "monster":
      return db
        .select({ id: monsters.id, name: monsters.name })
        .from(monsters)
        .where(like(monsters.name, `%${query}%`))
        .limit(10);
    case "item":
      return db
        .select({ id: items.id, name: items.name })
        .from(items)
        .where(like(items.name, `%${query}%`))
        .limit(10);
    case "companion":
      return db
        .select({ id: companions.id, name: companions.name })
        .from(companions)
        .where(like(companions.name, `%${query}%`))
        .limit(10);
    case "subclass":
      return db
        .select({ id: subclasses.id, name: subclasses.name })
        .from(subclasses)
        .where(like(subclasses.name, `%${query}%`))
        .limit(10);
    case "school":
      return db
        .select({ id: spellSchools.id, name: spellSchools.name })
        .from(spellSchools)
        .where(like(spellSchools.name, `%${query}%`))
        .limit(10);
    case "ancestry":
      return db
        .select({ id: ancestries.id, name: ancestries.name })
        .from(ancestries)
        .where(like(ancestries.name, `%${query}%`))
        .limit(10);
    case "background":
      return db
        .select({ id: backgrounds.id, name: backgrounds.name })
        .from(backgrounds)
        .where(like(backgrounds.name, `%${query}%`))
        .limit(10);
    default:
      return [];
  }
}
