// Dev-only test users to exercise authenticated flows (official content is
// owned by nimble-co, which you can't log in as). Creates `dev` (normal) and
// `admin`. Log in via /api/auth/dev-login?dev-login&username=dev while running
// `pnpm dev`. Skipped when NODE_ENV=production; idempotent.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { getExampleAdventures } from "@/app/adventures/exampleAdventures";
import { EXAMPLE_COMPANIONS } from "@/app/companions/exampleCompanions";
import {
  ITEM_BACKDROP_FIXTURES,
  ITEM_CONTENT_FIXTURES,
  ITEM_RARITY_FIXTURES,
} from "@/app/dev/entities/items/fixtures";
import { createAdventure } from "@/lib/db/adventures";
import { createCollection } from "@/lib/db/collection";
import { createCompanion } from "@/lib/db/companion";
import { createCustomRule } from "@/lib/db/custom-rule";
import { getDatabase } from "@/lib/db/drizzle";
import { createEncounter } from "@/lib/db/encounter";
import {
  adventures,
  collections,
  companions,
  customRules,
  encounters,
  items,
  itemsCollections,
  monsters,
  users,
} from "@/lib/db/schema";
import {
  OFFICIAL_USER_ID,
  parseJSONAPIMonster,
  validateOfficialMonstersJSON,
} from "@/lib/services/monsters/official";
import {
  createHazard,
  createMonster,
} from "@/lib/services/monsters/repository";
import { ITEM_EXAMPLES } from "@/lib/services/items/examples";

interface DevUser {
  id: string;
  discordId: string;
  username: string;
  displayName: string;
  role: "admin" | null;
}

const DEV_USER: DevUser = {
  id: "11111111-1111-1111-1111-111111111111",
  discordId: "dev-user-1",
  username: "dev",
  displayName: "Dev User",
  role: null,
};

const DEV_ADMIN: DevUser = {
  id: "22222222-2222-2222-2222-222222222222",
  discordId: "dev-admin-1",
  username: "admin",
  displayName: "Dev Admin",
  role: "admin",
};

const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";
const DEV_ITEM_ID = "33333333-3333-3333-3333-333333333333";
const DEV_HEALING_POTION_ID = "55555555-5555-4555-8555-555555555555";
const DEV_GEM_OF_ESCAPE_ID = "66666666-6666-4666-8666-666666666666";
const DEV_ITEM_COLLECTION_ID = "44444444-4444-4444-4444-444444444444";

async function upsertDevUser(u: DevUser): Promise<void> {
  const db = await getDatabase();
  const values = {
    id: u.id,
    discordId: u.discordId,
    username: u.username,
    displayName: u.displayName,
    name: u.displayName,
    role: u.role,
    imageUrl: DEFAULT_AVATAR,
  };
  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.id,
      set: {
        discordId: u.discordId,
        username: u.username,
        displayName: u.displayName,
        name: u.displayName,
        role: u.role,
        imageUrl: DEFAULT_AVATAR,
      },
    });
}

// Two dev-owned monsters built from official stat blocks (avoids hand-crafting).
async function seedDevMonsters(): Promise<string[]> {
  const bestiaryPath = join(
    process.cwd(),
    "data",
    "official",
    "gmg",
    "bestiary.json"
  );
  const json = JSON.parse(readFileSync(bestiaryPath, "utf8"));
  const { monsters: officialMonsters } = validateOfficialMonstersJSON(json);

  const samples = officialMonsters.slice(0, 2);
  const createdIds: string[] = [];

  for (const [index, monsterData] of samples.entries()) {
    const input = parseJSONAPIMonster(monsterData);
    input.name = `Dev's ${input.name}`;
    input.visibility = index === 0 ? "public" : "private";
    input.families = [];
    const created = await createMonster(input, DEV_USER.discordId);
    createdIds.push(created.id);
  }

  return createdIds;
}

async function seedDevItems(): Promise<number> {
  const db = await getDatabase();
  const fixtureItems = [
    ...ITEM_RARITY_FIXTURES.map(({ item }) => item),
    ...ITEM_BACKDROP_FIXTURES.map(({ item }) => item),
    ...ITEM_CONTENT_FIXTURES.map(({ item }) => item),
  ];

  await db
    .insert(items)
    .values(
      fixtureItems.map((item) => ({
        id: item.id,
        name: item.name,
        kind: item.kind,
        description: item.description,
        moreInfo: item.moreInfo,
        rarity: item.rarity,
        visibility: item.visibility,
        userId: DEV_USER.id,
        imageIcon: item.imageIcon,
        imageBgIcon: item.imageBgIcon,
        imageColor: item.imageColor,
        imageBgColor: item.imageBgColor,
        imageBackdrop: item.imageBackdrop,
      }))
    )
    .onConflictDoNothing();

  return fixtureItems.length;
}

// Official seeds cover the other reference types. Keep these outside the
// monster guard so existing dev databases also gain the missing examples.
async function seedDevReferences(): Promise<void> {
  const db = getDatabase();
  const companion = EXAMPLE_COMPANIONS.Stabs;
  const existingCompanion = await db.query.companions.findFirst({
    columns: { id: true },
    where: and(
      eq(companions.userId, DEV_USER.id),
      eq(companions.name, companion.name),
      eq(companions.visibility, "public")
    ),
  });
  if (!existingCompanion) {
    await createCompanion({
      ...companion,
      visibility: "public",
      discordId: DEV_USER.discordId,
    });
  }

  const ruleName = "Dev's Safe Rest";
  const existingRule = await db.query.customRules.findFirst({
    columns: { id: true },
    where: and(
      eq(customRules.userId, DEV_USER.id),
      eq(customRules.name, ruleName),
      eq(customRules.visibility, "public")
    ),
  });
  if (!existingRule) {
    await createCustomRule({
      userId: DEV_USER.id,
      name: ruleName,
      content:
        "Heroes can only take a Safe Rest in a secure, sheltered location.",
      keywords: "rest, recovery",
      visibility: "public",
      links: [],
    });
  }

  const officialMonsters = await db
    .select({ id: monsters.id, name: monsters.name })
    .from(monsters)
    .where(
      and(
        eq(monsters.userId, OFFICIAL_USER_ID),
        eq(monsters.visibility, "public"),
        eq(monsters.hazard, false),
        inArray(monsters.name, [
          "Goblin Minion",
          "Goblin",
          "Bugbear",
          "Skeleton",
        ])
      )
    );
  const goblinMinionId = officialMonsters.find(
    (monster) => monster.name === "Goblin Minion"
  )?.id;
  if (!goblinMinionId) {
    throw new Error("Seed official monsters before dev reference examples.");
  }
  const encounterName = "Dev's Goblin Patrol";
  const existingEncounter = await db.query.encounters.findFirst({
    columns: { id: true },
    where: and(
      eq(encounters.creatorId, DEV_USER.id),
      eq(encounters.name, encounterName),
      eq(encounters.visibility, "public")
    ),
  });
  if (!existingEncounter) {
    await createEncounter({
      discordId: DEV_USER.discordId,
      name: encounterName,
      description: "A goblin patrol on the trail to the Delian Tomb.",
      visibility: "public",
      heroCount: 4,
      heroLevel: 1,
      monsters: [{ monsterId: goblinMinionId, quantity: 4, isPerHero: false }],
    });
  }

  const adventure = getExampleAdventures({
    goblinMinionId,
    goblinId: officialMonsters.find((monster) => monster.name === "Goblin")?.id,
    bugbearId: officialMonsters.find((monster) => monster.name === "Bugbear")
      ?.id,
    skeletonId: officialMonsters.find((monster) => monster.name === "Skeleton")
      ?.id,
  })["delian tomb"];
  const existingAdventure = await db.query.adventures.findFirst({
    columns: { id: true },
    where: and(
      eq(adventures.userId, DEV_USER.id),
      eq(adventures.name, adventure.name),
      eq(adventures.visibility, "public")
    ),
  });
  if (!existingAdventure) {
    await createAdventure(DEV_USER.id, {
      ...adventure,
      // The builder uploads example images to blob storage. Dev seeds must
      // work offline without bucket credentials, so omit the map placeholder.
      nodes: adventure.nodes.filter((node) => node.kind !== "image"),
    });
  }

  const hazardName = "Dev's Rockfall";
  const existingHazard = await db.query.monsters.findFirst({
    columns: { id: true },
    where: and(
      eq(monsters.userId, DEV_USER.id),
      eq(monsters.name, hazardName),
      eq(monsters.hazard, true),
      eq(monsters.visibility, "public")
    ),
  });
  if (!existingHazard) {
    await createHazard(
      {
        name: hazardName,
        level: "1",
        levelInt: 1,
        visibility: "public",
        abilities: [
          {
            id: "unstable-ceiling",
            name: "Unstable Ceiling",
            description:
              "Loose stones fall when a creature crosses the passage.",
          },
        ],
        actions: [
          {
            id: "falling-stones",
            name: "Falling Stones",
            damage: "1d6",
            description: "DC 10 DEX save to avoid the falling stones.",
          },
        ],
        actionPreface: "When triggered:",
      },
      DEV_USER.discordId
    );
  }
  console.log(
    '  ensured public companion, rule, encounter, adventure, and hazard examples owned by "dev"'
  );
}

export async function seedDevData(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping dev user seed (NODE_ENV=production).");
    return;
  }

  console.log("Seeding dev test users ...");
  await upsertDevUser(DEV_USER);
  await upsertDevUser(DEV_ADMIN);

  const db = await getDatabase();

  const devItems = [
    {
      id: DEV_ITEM_ID,
      name: "Dev's Bottomless Bag",
      kind: "Wondrous item",
      description: "A sample magic item owned by the dev user.",
      rarity: "uncommon",
      visibility: "public",
      userId: DEV_USER.id,
    },
    {
      id: DEV_HEALING_POTION_ID,
      ...ITEM_EXAMPLES["Healing Potion"],
      userId: DEV_USER.id,
    },
    {
      id: DEV_GEM_OF_ESCAPE_ID,
      ...ITEM_EXAMPLES["Gem of Escape"],
      userId: DEV_USER.id,
    },
  ] satisfies (typeof items.$inferInsert)[];
  for (const item of devItems) {
    await db.insert(items).values(item).onConflictDoUpdate({
      target: items.id,
      set: item,
    });
  }
  await db
    .insert(collections)
    .values({
      id: DEV_ITEM_COLLECTION_ID,
      creatorId: DEV_USER.id,
      name: "Dev's Magic Items",
      description: "Sample collection containing only magic items.",
      visibility: "public",
    })
    .onConflictDoNothing();
  for (const item of devItems) {
    await db
      .insert(itemsCollections)
      .values({
        itemId: item.id,
        collectionId: DEV_ITEM_COLLECTION_ID,
      })
      .onConflictDoNothing();
  }

  const fixtureItemCount = await seedDevItems();

  const existing = await db
    .select({ id: monsters.id })
    .from(monsters)
    .where(eq(monsters.userId, DEV_USER.id))
    .limit(1);

  if (existing.length === 0) {
    const monsterIds = await seedDevMonsters();

    const officialMonster = await db
      .select({ id: monsters.id })
      .from(monsters)
      .where(eq(monsters.userId, OFFICIAL_USER_ID))
      .limit(1);

    await createCollection({
      name: "Dev's Collection",
      description: "Sample collection owned by the dev user.",
      visibility: "public",
      monsterIds: [...monsterIds, ...officialMonster.map((m) => m.id)],
      discordId: DEV_USER.discordId,
    });

    console.log(
      `  created ${monsterIds.length} monsters + 1 collection owned by "dev"`
    );
  } else {
    console.log('  "dev" already owns content — leaving it untouched');
  }

  await seedDevReferences();

  console.log(
    `  ensured ${fixtureItemCount + devItems.length} varied items + 1 magic-item-only collection owned by "dev"`
  );

  console.log(
    "Dev users ready. Log in via /api/auth?dev-login&username=dev (or =admin)."
  );
}
