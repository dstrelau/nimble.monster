import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import {
  createCondition,
  deleteCondition,
  listLibraryConditions,
  updateConditionDescription,
} from "./condition";
import * as schema from "./schema";

const state = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("./drizzle", () => ({ getDatabase: state.getDatabase }));
const client = createClient({ url: ":memory:" });
const db = drizzle(client, { schema });

beforeAll(async () => {
  state.getDatabase.mockReturnValue(db);
  await migrate(db, { migrationsFolder: "migrations" });
  await db.insert(schema.users).values([
    { id: "owner", username: "owner", discordId: "owner-discord" },
    { id: "other", username: "other", discordId: "other-discord" },
  ]);
  const { monsters } = validateOfficialMonstersJSON(
    JSON.parse(readFileSync("data/official/gmg/bestiary.json", "utf8"))
  );
  const monster = parseJSONAPIMonster(monsters[0]);
  // Start with official content, then add references as a user would.
  await db.insert(schema.monsters).values({
    id: "monster",
    userId: "owner",
    name: monster.name,
    hp: monster.hp,
    level: String(monster.level),
    armor: "",
    actions: monster.actions,
    moreInfo: "[[Dazed]] and [[DAZED|daze]]",
    members: [{ name: "Ally", actions: [{ description: "[[Dazed]]" }] }],
  });
  await db.insert(schema.monsters).values({
    id: "hazard",
    userId: "owner",
    name: monster.name,
    hp: monster.hp,
    level: String(monster.level),
    armor: "",
    hazard: true,
    actions: [
      { name: "[[Unused]]", description: "[[Dazed]]", damage: "[[Dazed]]" },
    ],
    actionPreface: "[[Unused]]",
  });
  await db.insert(schema.families).values([
    {
      id: "family",
      creatorId: "owner",
      name: "Family",
      description: "[[Dazed]]",
    },
    {
      id: "inherited",
      creatorId: "other",
      name: "Inherited",
      abilities: [{ name: "Trait", description: "[[Inherited]]" }],
    },
  ]);
  await db
    .insert(schema.monstersFamilies)
    .values({ monsterId: "monster", familyId: "inherited" });
  await db.insert(schema.companions).values({
    userId: "owner",
    name: "Companion",
    hpPerLevel: "2",
    dyingRule: "[[Dazed]]",
  });
  await db.insert(schema.ancestries).values({
    userId: "owner",
    name: "Ancestry",
    description: "",
    abilities: [{ description: "[[Dazed]]" }],
  });
  await db
    .insert(schema.backgrounds)
    .values({ userId: "owner", name: "Background", description: "[[Dazed]]" });
  await db.insert(schema.classes).values({
    userId: "owner",
    name: "Class",
    description: "[[Dazed]]",
    hitDie: "d6",
    startingHp: 6,
  });
  await db.insert(schema.collections).values({
    creatorId: "owner",
    name: "Collection",
    description: "[[Dazed]]",
  });
  await db.insert(schema.encounters).values({
    creatorId: "owner",
    name: "Encounter",
    description: "[[Dazed]]",
  });
  await db.insert(schema.customRules).values({
    userId: "owner",
    name: "Rule",
    content: "[[Dazed]] twice [[DAZED]]",
  });
  await db.insert(schema.adventures).values({
    id: "adventure",
    userId: "owner",
    name: "Adventure",
    summary: "[[Unused]]",
  });
  await db.insert(schema.adventureNodes).values([
    {
      adventureId: "adventure",
      kind: "text",
      content: "[[Dazed]]",
      orderIndex: 0,
    },
    {
      adventureId: "adventure",
      kind: "callout",
      content: "[[Dazed]]",
      orderIndex: 1,
    },
    {
      adventureId: "adventure",
      kind: "section",
      content: "[[Unused]]",
      orderIndex: 2,
    },
  ]);
  await db.insert(schema.items).values([
    {
      userId: "owner",
      name: "Bell",
      description: "[[dazed|daze]] twice [[Dazed]]",
      moreInfo: "[[Dazed]]",
    },
    { userId: "owner", name: "Charm", description: "[[Dazed]]" },
    { userId: "other", name: "Other bell", description: "[[Dazed]]" },
    {
      userId: "owner",
      name: "Not a reference",
      description: "Dazed and [[Dazedness]]",
    },
  ]);
  await db.insert(schema.spellSchools).values({
    id: "school",
    userId: "owner",
    name: "Mind",
    description: "[[Dazed]]",
  });
  await db.insert(schema.spells).values({
    schoolId: "school",
    name: "Daze",
    description: "[[Dazed]]",
    upcast: "[[Unused]]",
  });
  await db.insert(schema.subclasses).values({
    id: "subclass",
    userId: "owner",
    name: "Seer",
    className: "Mage",
    tagline: "[[Dazed]]",
  });
  await db.insert(schema.classAbilityLists).values({
    id: "list",
    userId: "owner",
    name: "Powers",
    description: "[[Dazed]]",
  });
  await db.insert(schema.classAbilityItems).values({
    classAbilityListId: "list",
    name: "Power",
    description: "[[Dazed]]",
    orderIndex: 0,
  });
  await db
    .insert(schema.subclassesClassAbilityLists)
    .values({ subclassId: "subclass", abilityListId: "list", orderIndex: 0 });
  await db.insert(schema.randomTables).values({
    id: "table",
    creatorId: "owner",
    name: "Events",
    description: "[[Dazed]]",
  });
  await db.insert(schema.randomSubtables).values({
    id: "subtable",
    randomTableId: "table",
    title: "Events",
    columns: [{ id: "name", name: "Result" }],
    orderIndex: 0,
  });
  await db.insert(schema.randomSubtableRows).values({
    subtableId: "subtable",
    cells: { name: "[[Unused]]" },
    orderIndex: 0,
  });
  await db.insert(schema.adventureNodes).values({
    adventureId: "adventure",
    kind: "table",
    tableId: "table",
    orderIndex: 3,
  });
  await db.insert(schema.adventures).values({
    id: "filtered-adventure",
    userId: "owner",
    name: "Filtered adventure",
  });
  await db.insert(schema.adventureNodes).values({
    adventureId: "filtered-adventure",
    kind: "table",
    tableId: "table",
    subtableIds: [],
    orderIndex: 0,
  });
});

afterAll(() => client.close());

describe("library conditions", () => {
  it("counts distinct owned entities by name, including references created before the condition", async () => {
    await createCondition("owner-discord", "Dazed", "Cannot take reactions.");
    await createCondition("owner-discord", "Unused", "Unused description.");
    await createCondition(
      "owner-discord",
      "Inherited",
      "Inherited description."
    );
    await createCondition(
      "other-discord",
      "Dazed",
      "Other user's description."
    );
    const conditions = await listLibraryConditions("owner");
    expect(conditions.map((condition) => condition.name)).toEqual([
      "Dazed",
      "Inherited",
      "Unused",
    ]);
    expect(conditions[0].usage).toEqual({
      monsters: 1,
      hazards: 1,
      items: 2,
      spells: 1,
      companions: 1,
      ancestries: 1,
      backgrounds: 1,
      families: 1,
      classes: 1,
      subclasses: 1,
      spellSchools: 1,
      collections: 1,
      encounters: 1,
      tables: 1,
      rules: 1,
      adventures: 2,
    });
    expect(conditions[1].usage).toEqual({
      monsters: 1,
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
    });
    expect(conditions[2].usage).toEqual({
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
      tables: 1,
      rules: 0,
      adventures: 1,
    });
  });

  it("allows only the owner to edit text or delete and preserves the name", async () => {
    const condition = await createCondition(
      "owner-discord",
      "Guarded",
      "Original"
    );
    await expect(
      updateConditionDescription(condition.id, "other", "Unauthorized")
    ).resolves.toBeNull();
    expect(await deleteCondition(condition.id, "other-discord")).toBeNull();
    await updateConditionDescription(condition.id, "owner", "Updated");
    expect(
      (await listLibraryConditions("owner")).find(
        (entry) => entry.id === condition.id
      )
    ).toMatchObject({ name: "Guarded", description: "Updated" });
    await deleteCondition(condition.id, "owner-discord");
    expect(
      (await listLibraryConditions("owner")).some(
        (entry) => entry.id === condition.id
      )
    ).toBe(false);
  });
});
