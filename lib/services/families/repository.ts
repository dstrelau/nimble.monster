"use server";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/lib/db/drizzle";
import {
  type AwardRow,
  awards,
  type FamilyRow,
  families,
  monsters,
  monstersAwards,
  monstersFamilies,
  type SourceRow,
  sources,
  type UserRow,
  users,
} from "@/lib/db/schema";
import type { Monster } from "@/lib/services/monsters";
import type { Ability, Award, Family, Source, User } from "@/lib/types";

const toUserFromRow = (u: UserRow): User => ({
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

const toAbilitiesFromRow = (abilities: unknown): Ability[] => {
  return ((abilities as Omit<Ability, "id">[]) || []).map((ability) => ({
    ...ability,
    id: crypto.randomUUID(),
  }));
};

const toSourceFromRow = (s: SourceRow | null): Source | undefined => {
  if (!s) return undefined;
  return {
    id: s.id,
    name: s.name,
    license: s.license,
    link: s.link,
    abbreviation: s.abbreviation,
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
  };
};

const toAwardFromRow = (a: AwardRow): Award => ({
  id: a.id,
  slug: a.slug,
  name: a.name,
  abbreviation: a.abbreviation,
  description: a.description,
  url: a.url,
  color: a.color,
  icon: a.icon,
  createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
  updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
});

import type { Action } from "@/lib/types";

const toActionsFromRow = (actions: unknown): Action[] => {
  return ((actions as Omit<Action, "id">[]) || []).map((action) => ({
    ...action,
    id: crypto.randomUUID(),
  }));
};

export async function getRandomFeaturedFamily(): Promise<Family | null> {
  const db = getDatabase();

  // Get all featured families
  const featuredFamilies = await db
    .select()
    .from(families)
    .where(eq(families.featured, true))
    .innerJoin(users, eq(families.creatorId, users.id));

  if (featuredFamilies.length === 0) return null;

  // Filter to families that have public monsters
  const familiesWithMonsters: Array<{
    family: FamilyRow;
    creator: UserRow;
    monsters: Monster[];
  }> = [];

  for (const { families: family, users: creator } of featuredFamilies) {
    // Get all public monsters in this family
    const monsterFamilyLinks = await db
      .select()
      .from(monstersFamilies)
      .where(eq(monstersFamilies.familyId, family.id))
      .innerJoin(monsters, eq(monstersFamilies.monsterId, monsters.id))
      .innerJoin(users, eq(monsters.userId, users.id))
      .leftJoin(sources, eq(monsters.sourceId, sources.id));

    const publicMonsters = monsterFamilyLinks.filter(
      (link) => link.monsters.visibility === "public"
    );

    if (publicMonsters.length > 0) {
      // Load full monster data for each monster
      const fullMonsters: Monster[] = [];

      for (const link of publicMonsters) {
        // Get awards for this monster
        const monsterAwards = await db
          .select()
          .from(monstersAwards)
          .where(eq(monstersAwards.monsterId, link.monsters.id))
          .innerJoin(awards, eq(monstersAwards.awardId, awards.id));

        // Get families for this monster
        const monsterFamilies = await db
          .select()
          .from(monstersFamilies)
          .where(eq(monstersFamilies.monsterId, link.monsters.id))
          .innerJoin(families, eq(monstersFamilies.familyId, families.id))
          .innerJoin(users, eq(families.creatorId, users.id));

        fullMonsters.push({
          id: link.monsters.id,
          hp: link.monsters.hp,
          legendary: link.monsters.legendary || false,
          minion: link.monsters.minion,
          level: link.monsters.level,
          levelInt: link.monsters.levelInt,
          name: link.monsters.name,
          visibility: (link.monsters.visibility ?? "public") as
            | "public"
            | "private",
          size: link.monsters.size,
          armor: link.monsters.armor === "" ? "none" : link.monsters.armor,
          paperforgeId: link.monsters.paperforgeId ?? undefined,
          createdAt: link.monsters.createdAt
            ? new Date(link.monsters.createdAt)
            : new Date(),
          kind: link.monsters.kind,
          role: link.monsters.role as Monster["role"],
          bloodied: link.monsters.bloodied,
          lastStand: link.monsters.lastStand,
          speed: link.monsters.speed,
          fly: link.monsters.fly ?? 0,
          swim: link.monsters.swim ?? 0,
          climb: link.monsters.climb ?? 0,
          teleport: link.monsters.teleport ?? 0,
          burrow: link.monsters.burrow ?? 0,
          saves: link.monsters.saves,
          actionPreface: link.monsters.actionPreface ?? "ACTIONS:",
          abilities: toAbilitiesFromRow(link.monsters.abilities),
          actions: toActionsFromRow(link.monsters.actions),
          moreInfo: link.monsters.moreInfo ?? undefined,
          creator: toUserFromRow(link.users),
          source: toSourceFromRow(link.sources),
          awards: monsterAwards.map((a) => toAwardFromRow(a.awards)),
          families: monsterFamilies.map((f) => ({
            id: f.families.id,
            name: f.families.name,
            description: f.families.description ?? undefined,
            abilities: toAbilitiesFromRow(f.families.abilities),
            visibility: f.families.visibility ?? undefined,
            creatorId: f.families.creatorId,
            creator: toUserFromRow(f.users),
          })),
          updatedAt: link.monsters.updatedAt
            ? new Date(link.monsters.updatedAt)
            : new Date(),
          remixedFromId: link.monsters.remixedFromId,
          remixedFrom: null,
        });
      }

      // Sort monsters by level
      fullMonsters.sort((a, b) => a.levelInt - b.levelInt);

      familiesWithMonsters.push({
        family,
        creator,
        monsters: fullMonsters,
      });
    }
  }

  if (familiesWithMonsters.length === 0) return null;

  // Pick a random family
  const randomIndex = Math.floor(Math.random() * familiesWithMonsters.length);
  const {
    family,
    creator,
    monsters: familyMonsters,
  } = familiesWithMonsters[randomIndex];

  return {
    id: family.id,
    name: family.name,
    description: family.description ?? undefined,
    abilities: toAbilitiesFromRow(family.abilities),
    visibility: family.visibility ?? undefined,
    monsterCount: familyMonsters.length,
    creatorId: family.creatorId,
    creator: toUserFromRow(creator),
    monsters: familyMonsters,
  };
}
