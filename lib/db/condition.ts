import { and, eq, sql } from "drizzle-orm";
import { type ConditionUsage, extractConditions } from "@/lib/conditions";
import type { Condition } from "@/lib/types";
import { getDatabase } from "./drizzle";
import { conditions, monstersConditions, users } from "./schema";

export interface LibraryCondition extends Condition {
  usage: ConditionUsage;
}

// One owner-scoped pass, independent of the number of conditions. Do not use
// monsters_conditions: name-based references can predate a condition's creation.
export async function listLibraryConditions(
  userId: string
): Promise<LibraryCondition[]> {
  const db = getDatabase();
  const owned = await db
    .select()
    .from(conditions)
    .where(eq(conditions.creatorId, userId))
    .orderBy(conditions.name);
  if (!owned.length) return [];

  const entities = await db.all<{
    id: string;
    kind: keyof ConditionUsage;
    content: string;
  }>(sql`
    SELECT id, CASE WHEN hazard THEN 'hazards' ELSE 'monsters' END AS kind, json_object(
      'actions', json(actions), 'abilities', json(abilities),
      'members', json(coalesce(members, '[]')), 'bloodied', bloodied,
      'lastStand', last_stand, 'moreInfo', more_info,
      'peaceful', peaceful, 'deadly', deadly) AS content
    FROM monsters WHERE user_id = ${userId}
    UNION ALL SELECT monsters.id, CASE WHEN monsters.hazard THEN 'hazards' ELSE 'monsters' END,
      json_object('abilities', json(families.abilities))
    FROM monsters_families JOIN monsters ON monsters_families.monster_id = monsters.id
    JOIN families ON monsters_families.family_id = families.id WHERE monsters.user_id = ${userId}
    UNION ALL SELECT id, 'items', json_object('description', description, 'moreInfo', more_info)
    FROM items WHERE user_id = ${userId}
    UNION ALL SELECT spells.id, 'spells', json_object('description', spells.description)
    FROM spells JOIN spell_schools ON spells.school_id = spell_schools.id WHERE spell_schools.user_id = ${userId}
    UNION ALL SELECT id, 'companions', json_object('actions', json(actions), 'abilities', json(abilities),
      'dyingRule', dying_rule, 'moreInfo', more_info)
    FROM companions WHERE user_id = ${userId}
    UNION ALL SELECT id, 'ancestries', json_object('description', description, 'abilities', json(abilities))
    FROM ancestries WHERE user_id = ${userId}
    UNION ALL SELECT id, 'backgrounds', json_object('description', description)
    FROM backgrounds WHERE user_id = ${userId}
    UNION ALL SELECT id, 'families', json_object('description', description, 'abilities', json(abilities))
    FROM families WHERE user_id = ${userId}
    UNION ALL SELECT id, 'classes', json_object('description', description)
    FROM classes WHERE user_id = ${userId}
    UNION ALL SELECT class_abilities.class_id, 'classes', json_object('description', class_abilities.description)
    FROM class_abilities JOIN classes ON class_abilities.class_id = classes.id WHERE classes.user_id = ${userId}
    UNION ALL SELECT classes.id, 'classes', json_object('description', class_ability_lists.description)
    FROM classes_class_ability_lists JOIN class_ability_lists ON classes_class_ability_lists.ability_list_id = class_ability_lists.id
    JOIN classes ON classes_class_ability_lists.class_id = classes.id WHERE classes.user_id = ${userId}
    UNION ALL SELECT classes.id, 'classes', json_object('description', class_ability_items.description)
    FROM class_ability_items JOIN class_ability_lists ON class_ability_items.class_ability_list_id = class_ability_lists.id
    JOIN classes_class_ability_lists ON classes_class_ability_lists.ability_list_id = class_ability_lists.id
    JOIN classes ON classes_class_ability_lists.class_id = classes.id WHERE classes.user_id = ${userId}
    UNION ALL SELECT id, 'subclasses', json_object('description', description, 'tagline', tagline)
    FROM subclasses WHERE user_id = ${userId}
    UNION ALL SELECT subclass_abilities.subclass_id, 'subclasses', json_object('description', subclass_abilities.description)
    FROM subclass_abilities JOIN subclasses ON subclass_abilities.subclass_id = subclasses.id WHERE subclasses.user_id = ${userId}
    UNION ALL SELECT subclasses.id, 'subclasses', json_object('description', class_ability_lists.description)
    FROM subclasses_class_ability_lists JOIN class_ability_lists ON subclasses_class_ability_lists.ability_list_id = class_ability_lists.id
    JOIN subclasses ON subclasses_class_ability_lists.subclass_id = subclasses.id WHERE subclasses.user_id = ${userId}
    UNION ALL SELECT subclasses.id, 'subclasses', json_object('description', class_ability_items.description)
    FROM class_ability_items JOIN subclasses_class_ability_lists ON class_ability_items.class_ability_list_id = subclasses_class_ability_lists.ability_list_id
    JOIN subclasses ON subclasses_class_ability_lists.subclass_id = subclasses.id WHERE subclasses.user_id = ${userId}
    UNION ALL SELECT id, 'spellSchools', json_object('description', description)
    FROM spell_schools WHERE user_id = ${userId}
    UNION ALL SELECT id, 'collections', json_object('description', description)
    FROM collections WHERE user_id = ${userId}
    UNION ALL SELECT id, 'encounters', json_object('description', description)
    FROM encounters WHERE user_id = ${userId}
    UNION ALL SELECT id, 'tables', json_object('description', description)
    FROM random_tables WHERE user_id = ${userId}
    UNION ALL SELECT random_subtables.random_table_id, 'tables', json_object('cells',
      json((SELECT json_group_array(value) FROM json_each(random_subtable_rows.cells))))
    FROM random_subtable_rows JOIN random_subtables ON random_subtable_rows.subtable_id = random_subtables.id
    JOIN random_tables ON random_subtables.random_table_id = random_tables.id WHERE random_tables.user_id = ${userId}
    UNION ALL SELECT id, 'rules', json_object('content', content)
    FROM custom_rules WHERE user_id = ${userId}
    UNION ALL SELECT adventures.id, 'adventures', json_object('content', adventure_nodes.content)
    FROM adventure_nodes JOIN adventures ON adventure_nodes.adventure_id = adventures.id
    WHERE adventures.user_id = ${userId} AND adventure_nodes.kind IN ('text', 'callout')
    UNION ALL SELECT adventures.id, 'adventures', json_object('description', random_tables.description)
    FROM adventure_nodes JOIN adventures ON adventure_nodes.adventure_id = adventures.id
    JOIN random_tables ON adventure_nodes.table_id = random_tables.id
    WHERE adventures.user_id = ${userId} AND adventure_nodes.kind = 'table'
      AND (random_tables.user_id = ${userId} OR random_tables.visibility = 'public')
    UNION ALL SELECT adventures.id, 'adventures', json_object('cells',
      json((SELECT json_group_array(value) FROM json_each(random_subtable_rows.cells))))
    FROM adventure_nodes JOIN adventures ON adventure_nodes.adventure_id = adventures.id
    JOIN random_tables ON adventure_nodes.table_id = random_tables.id
    JOIN random_subtables ON random_subtables.random_table_id = random_tables.id
    JOIN random_subtable_rows ON random_subtable_rows.subtable_id = random_subtables.id
    WHERE adventures.user_id = ${userId} AND adventure_nodes.kind = 'table'
      AND (random_tables.user_id = ${userId} OR random_tables.visibility = 'public')
      AND (adventure_nodes.subtable_ids IS NULL OR random_subtables.id IN (SELECT value FROM json_each(adventure_nodes.subtable_ids)))
  `);

  const references = new Map<string, Map<keyof ConditionUsage, Set<string>>>();
  function visit(value: unknown, names: Set<string>, field?: string) {
    if (typeof value === "string") {
      for (const name of extractConditions(value)) names.add(name);
    } else if (Array.isArray(value)) {
      for (const child of value) visit(child, names);
    } else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        // Traverse only condition-aware text and its containers, not labels or metadata.
        if (
          [
            "actions",
            "abilities",
            "members",
            "description",
            "Description",
            "damage",
            "range",
            "alternative",
            "bloodied",
            "lastStand",
            "moreInfo",
            "peaceful",
            "deadly",
            "dyingRule",
            "tagline",
            "cells",
            "content",
          ].includes(key) ||
          (key === "name" && field === "alternative")
        ) {
          visit(child, names, key);
        }
      }
    }
  }
  for (const entity of entities) {
    const names = new Set<string>();
    visit(JSON.parse(entity.content), names);
    for (const name of names) {
      let usage = references.get(name);
      if (!usage) {
        usage = new Map();
        references.set(name, usage);
      }
      let ids = usage.get(entity.kind);
      if (!ids) {
        ids = new Set();
        usage.set(entity.kind, ids);
      }
      ids.add(entity.id);
    }
  }
  return owned.map((condition) => {
    const usage: ConditionUsage = {
      monsters: 0,
      hazards: 0,
      items: 0,
      spells: 0,
      companions: 0,
      ancestries: 0,
      backgrounds: 0,
      families: 0,
      classes: 0,
      subclasses: 0,
      spellSchools: 0,
      collections: 0,
      encounters: 0,
      tables: 0,
      rules: 0,
      adventures: 0,
    };
    references.get(condition.name.toLowerCase())?.forEach((ids, kind) => {
      usage[kind] = ids.size;
    });
    return { ...condition, usage };
  });
}

export async function updateConditionDescription(
  conditionId: string,
  userId: string,
  description: string
) {
  const result = await getDatabase()
    .update(conditions)
    .set({ description, updatedAt: new Date().toISOString() })
    .where(
      and(eq(conditions.id, conditionId), eq(conditions.creatorId, userId))
    )
    .returning();
  return result[0] ?? null;
}

export async function listOfficialConditions() {
  const db = getDatabase();
  return await db
    .select()
    .from(conditions)
    .where(eq(conditions.official, true));
}

export async function listConditionsForMonster(monsterId: string) {
  const db = getDatabase();
  return await db
    .select({
      monsterId: monstersConditions.monsterId,
      conditionId: monstersConditions.conditionId,
      inline: monstersConditions.inline,
      condition: conditions,
    })
    .from(monstersConditions)
    .innerJoin(conditions, eq(monstersConditions.conditionId, conditions.id))
    .where(eq(monstersConditions.monsterId, monsterId));
}

export async function listConditionsForDiscordId(discordId: string) {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return [];

  return await db
    .select({
      id: conditions.id,
      name: conditions.name,
      description: conditions.description,
      official: conditions.official,
    })
    .from(conditions)
    .where(eq(conditions.creatorId, userResult[0].id));
}

export async function createCondition(
  discordId: string,
  name: string,
  description: string
) {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) {
    throw new Error("User not found");
  }

  const result = await db
    .insert(conditions)
    .values({
      name,
      description,
      creatorId: userResult[0].id,
    })
    .returning();

  return result[0];
}

export async function deleteCondition(conditionId: string, discordId: string) {
  const db = getDatabase();

  const userResult = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (userResult.length === 0) return null;

  const result = await db
    .delete(conditions)
    .where(
      and(
        eq(conditions.id, conditionId),
        eq(conditions.creatorId, userResult[0].id)
      )
    )
    .returning();

  return result[0] ?? null;
}
