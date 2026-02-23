import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

// Enum value types (stored as text in SQLite)
export type ArmorType = "" | "medium" | "heavy";
export type SizeType =
  | "tiny"
  | "small"
  | "medium"
  | "large"
  | "huge"
  | "gargantuan";
export type CollectionVisibility = "public" | "private";
export type FamilyVisibility = "public" | "secret" | "private";
export type MonsterVisibility = "public" | "private";
export type CompanionVisibility = "public" | "private";
export type ItemVisibility = "public" | "private";
export type ItemRarity =
  | "unspecified"
  | "common"
  | "uncommon"
  | "rare"
  | "very_rare"
  | "legendary";
export type EntityImageType = "monster" | "companion" | "item";
export type GenerationStatus = "generating" | "completed" | "failed";
export type SubclassVisibility = "public" | "private";
export type SpellSchoolVisibility = "public" | "private";
export type AncestryRarity = "common" | "exotic";
export type MonsterRole =
  | "melee"
  | "ranged"
  | "controller"
  | "support"
  | "aoe"
  | "summoner"
  | "striker"
  | "ambusher"
  | "defender"
  | "skirmisher";

// Users table
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  discordId: text("discord_id").unique(),
  username: text("username").unique(),
  avatar: text("avatar"),
  refreshToken: text("refresh_token"),
  displayName: text("display_name"),
  imageUrl: text("image_url"),
  role: text("role"),
  name: text("name").notNull().default(""),
  email: text("email").unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  bannerDismissed: integer("banner_dismissed", { mode: "boolean" }).default(
    false
  ),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Collections table
export const collections = sqliteTable(
  "collections",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    public: integer("public", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    description: text("description").notNull().default(""),
    visibility: text("visibility")
      .$type<CollectionVisibility>()
      .default("public"),
  },
  (table) => [index("idx_collections_user_id").on(table.creatorId)]
);

// Sources table
export const sources = sqliteTable("sources", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  license: text("license").notNull(),
  link: text("link").notNull(),
  abbreviation: text("abbreviation").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Monsters table
export const monsters = sqliteTable(
  "monsters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    remixedFromId: text("remixed_from_id"),
    name: text("name").notNull(),
    level: text("level").notNull(),
    hp: integer("hp").notNull(),
    armor: text("armor").$type<ArmorType>().notNull(),
    size: text("size").$type<SizeType>().notNull().default("medium"),
    speed: integer("speed").notNull().default(0),
    fly: integer("fly").notNull().default(0),
    swim: integer("swim").notNull().default(0),
    actions: text("actions", { mode: "json" }).notNull().default("[]"),
    abilities: text("abilities", { mode: "json" }).notNull().default("[]"),
    legendary: integer("legendary", { mode: "boolean" }).default(false),
    bloodied: text("bloodied").notNull().default(""),
    lastStand: text("last_stand").notNull().default(""),
    saves: text("saves").notNull().default(""),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    kind: text("kind").notNull().default(""),
    visibility: text("visibility").$type<MonsterVisibility>().default("public"),
    actionPreface: text("action_preface"),
    moreInfo: text("more_info").default(""),
    burrow: integer("burrow").notNull().default(0),
    climb: integer("climb").notNull().default(0),
    teleport: integer("teleport").notNull().default(0),
    minion: integer("minion", { mode: "boolean" }).notNull().default(false),
    levelInt: integer("level_int").notNull().default(0),
    role: text("role").$type<MonsterRole>(),
    paperforgeId: text("paperforge_id"),
    isOfficial: integer("is_official", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [index("idx_monsters_user_id").on(table.userId)]
);

// Items table
export const items = sqliteTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    kind: text("kind").notNull().default(""),
    description: text("description").notNull().default(""),
    moreInfo: text("more_info").default(""),
    visibility: text("visibility").$type<ItemVisibility>().default("public"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    remixedFromId: text("remixed_from_id"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    imageIcon: text("image_icon"),
    rarity: text("rarity").$type<ItemRarity>().default("unspecified"),
    imageBgIcon: text("image_bg_icon"),
    imageColor: text("image_color"),
    imageBgColor: text("image_bg_color"),
  },
  (table) => [index("idx_items_user_id").on(table.userId)]
);

// Companions table
export const companions = sqliteTable(
  "companions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    kind: text("kind").notNull().default(""),
    class: text("class").notNull().default(""),
    hpPerLevel: text("hp_per_level").notNull(),
    wounds: integer("wounds").notNull().default(0),
    size: text("size").$type<SizeType>().notNull().default("medium"),
    saves: text("saves").notNull().default(""),
    actions: text("actions", { mode: "json" }).notNull().default("[]"),
    abilities: text("abilities", { mode: "json" }).notNull().default("[]"),
    actionPreface: text("action_preface"),
    dyingRule: text("dying_rule").notNull().default(""),
    moreInfo: text("more_info").default(""),
    visibility: text("visibility")
      .$type<CompanionVisibility>()
      .default("public"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    paperforgeId: text("paperforge_id"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_companions_user_id").on(table.userId)]
);

// Families table
export const families = sqliteTable("families", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  creatorId: text("user_id")
    .notNull()
    .references(() => users.id, { onUpdate: "cascade" }),
  visibility: text("visibility").$type<FamilyVisibility>().default("public"),
  name: text("name").notNull(),
  abilities: text("abilities", { mode: "json" }).notNull().default("[]"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  description: text("description"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
});

// Conditions table
export const conditions = sqliteTable("conditions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  official: integer("official", { mode: "boolean" }).notNull().default(false),
  creatorId: text("creator_id")
    .notNull()
    .references(() => users.id, { onUpdate: "cascade" }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Subclasses table
export const subclasses = sqliteTable(
  "subclasses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    className: text("class_name").notNull(),
    namePreface: text("name_preface"),
    description: text("description"),
    visibility: text("visibility")
      .$type<SubclassVisibility>()
      .default("public"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    tagline: text("tagline"),
  },
  (table) => [index("idx_subclasses_user_id").on(table.userId)]
);

// Subclass abilities table
export const subclassAbilities = sqliteTable(
  "subclass_abilities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    subclassId: text("subclass_id")
      .notNull()
      .references(() => subclasses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    level: integer("level").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [index("idx_subclass_abilities_subclass_id").on(table.subclassId)]
);

// Spells table
export const spells = sqliteTable(
  "spells",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    schoolId: text("school_id")
      .notNull()
      .references(() => spellSchools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    tier: integer("tier").notNull().default(0),
    actions: integer("actions").notNull().default(1),
    reaction: integer("reaction", { mode: "boolean" }).notNull().default(false),
    targetType: text("target_type"),
    targetKind: text("target_kind"),
    targetDistance: integer("target_distance"),
    damage: text("damage"),
    description: text("description"),
    highLevels: text("high_levels"),
    concentration: text("concentration"),
    upcast: text("upcast"),
    utility: integer("utility", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_spells_school_id").on(table.schoolId)]
);

// Spell schools table
export const spellSchools = sqliteTable(
  "spell_schools",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description"),
    visibility: text("visibility")
      .$type<SpellSchoolVisibility>()
      .default("public"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_spell_schools_user_id").on(table.userId)]
);

// Backgrounds table
export const backgrounds = sqliteTable(
  "backgrounds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    requirement: text("requirement"),
    visibility: text("visibility").default("public"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_backgrounds_user_id").on(table.userId)]
);

// Ancestries table
export const ancestries = sqliteTable(
  "ancestries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    abilities: text("abilities", { mode: "json" }).notNull().default("[]"),
    size: text("size").notNull().default(""),
    rarity: text("rarity").$type<AncestryRarity>().default("common"),
    visibility: text("visibility").default("public"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_ancestries_user_id").on(table.userId)]
);

// Awards table
export const awards = sqliteTable("awards", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  url: text("url").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Entity images table
export const entityImages = sqliteTable(
  "entity_images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    entityType: text("entity_type").$type<EntityImageType>().notNull(),
    entityId: text("entity_id").notNull(),
    blobUrl: text("blob_url"),
    generatedAt: text("generated_at"),
    entityVersion: text("entity_version").notNull(),
    generationStatus: text("generation_status")
      .$type<GenerationStatus>()
      .default("generating"),
    generationStartedAt: text("generation_started_at").default(
      sql`CURRENT_TIMESTAMP`
    ),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique().on(table.entityType, table.entityId),
    index("idx_entity_images_status_started").on(
      table.generationStatus,
      table.generationStartedAt
    ),
  ]
);

// Join tables

// Monsters in collections
export const monstersCollections = sqliteTable(
  "monsters_collections",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.monsterId, table.collectionId] })]
);

// Items in collections
export const itemsCollections = sqliteTable(
  "items_collections",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade", onUpdate: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.collectionId] })]
);

// Spell schools in collections
export const spellSchoolsCollections = sqliteTable(
  "spell_schools_collections",
  {
    spellSchoolId: text("spell_school_id")
      .notNull()
      .references(() => spellSchools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [
    primaryKey({ columns: [table.spellSchoolId, table.collectionId] }),
  ]
);

// Companions in collections
export const companionsCollections = sqliteTable(
  "companions_collections",
  {
    companionId: text("companion_id")
      .notNull()
      .references(() => companions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.companionId, table.collectionId] })]
);

// Ancestries in collections
export const ancestriesCollections = sqliteTable(
  "ancestries_collections",
  {
    ancestryId: text("ancestry_id")
      .notNull()
      .references(() => ancestries.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.ancestryId, table.collectionId] })]
);

// Backgrounds in collections
export const backgroundsCollections = sqliteTable(
  "backgrounds_collections",
  {
    backgroundId: text("background_id")
      .notNull()
      .references(() => backgrounds.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.backgroundId, table.collectionId] })]
);

// Subclasses in collections
export const subclassesCollections = sqliteTable(
  "subclasses_collections",
  {
    subclassId: text("subclass_id")
      .notNull()
      .references(() => subclasses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.subclassId, table.collectionId] })]
);

// Monsters conditions
export const monstersConditions = sqliteTable(
  "monsters_conditions",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    conditionId: text("condition_id")
      .notNull()
      .references(() => conditions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    inline: integer("inline", { mode: "boolean" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.monsterId, table.conditionId] })]
);

// Monsters families
export const monstersFamilies = sqliteTable(
  "monsters_families",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.monsterId, table.familyId] })]
);

// Award join tables

export const monstersAwards = sqliteTable(
  "monsters_awards",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    awardId: text("award_id")
      .notNull()
      .references(() => awards.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.monsterId, table.awardId] })]
);

export const itemsAwards = sqliteTable(
  "items_awards",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade", onUpdate: "cascade" }),
    awardId: text("award_id")
      .notNull()
      .references(() => awards.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.awardId] })]
);

export const companionsAwards = sqliteTable(
  "companions_awards",
  {
    companionId: text("companion_id")
      .notNull()
      .references(() => companions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    awardId: text("award_id")
      .notNull()
      .references(() => awards.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.companionId, table.awardId] })]
);

export const subclassesAwards = sqliteTable(
  "subclasses_awards",
  {
    subclassId: text("subclass_id")
      .notNull()
      .references(() => subclasses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    awardId: text("award_id")
      .notNull()
      .references(() => awards.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.subclassId, table.awardId] })]
);

export const spellSchoolsAwards = sqliteTable(
  "spell_schools_awards",
  {
    schoolId: text("school_id")
      .notNull()
      .references(() => spellSchools.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    awardId: text("award_id")
      .notNull()
      .references(() => awards.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.schoolId, table.awardId] })]
);

export const backgroundsAwards = sqliteTable(
  "backgrounds_awards",
  {
    backgroundId: text("background_id")
      .notNull()
      .references(() => backgrounds.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    awardId: text("award_id")
      .notNull()
      .references(() => awards.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.backgroundId, table.awardId] })]
);

export const ancestriesAwards = sqliteTable(
  "ancestries_awards",
  {
    ancestryId: text("ancestry_id")
      .notNull()
      .references(() => ancestries.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    awardId: text("award_id")
      .notNull()
      .references(() => awards.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [primaryKey({ columns: [table.ancestryId, table.awardId] })]
);

// Type exports for row types
export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type MonsterRow = typeof monsters.$inferSelect;
export type MonsterInsert = typeof monsters.$inferInsert;
export type ItemRow = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;
export type CompanionRow = typeof companions.$inferSelect;
export type CompanionInsert = typeof companions.$inferInsert;
export type CollectionRow = typeof collections.$inferSelect;
export type CollectionInsert = typeof collections.$inferInsert;
export type FamilyRow = typeof families.$inferSelect;
export type FamilyInsert = typeof families.$inferInsert;
export type ConditionRow = typeof conditions.$inferSelect;
export type ConditionInsert = typeof conditions.$inferInsert;
export type SourceRow = typeof sources.$inferSelect;
export type SourceInsert = typeof sources.$inferInsert;
export type AwardRow = typeof awards.$inferSelect;
export type AwardInsert = typeof awards.$inferInsert;
export type SubclassRow = typeof subclasses.$inferSelect;
export type SubclassInsert = typeof subclasses.$inferInsert;
export type SubclassAbilityRow = typeof subclassAbilities.$inferSelect;
export type SubclassAbilityInsert = typeof subclassAbilities.$inferInsert;
export type SpellSchoolRow = typeof spellSchools.$inferSelect;
export type SpellSchoolInsert = typeof spellSchools.$inferInsert;
export type SpellRow = typeof spells.$inferSelect;
export type SpellInsert = typeof spells.$inferInsert;
export type BackgroundRow = typeof backgrounds.$inferSelect;
export type BackgroundInsert = typeof backgrounds.$inferInsert;
export type AncestryRow = typeof ancestries.$inferSelect;
export type AncestryInsert = typeof ancestries.$inferInsert;
export type EntityImageRow = typeof entityImages.$inferSelect;
export type EntityImageInsert = typeof entityImages.$inferInsert;
