import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
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
export type EncounterVisibility = "public" | "private";
export type RandomTableVisibility = "public" | "private";
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
export type ItemBackdrop = "glow" | "sunburst" | "motes" | "icon" | "bare";
export type EntityImageType = "monster" | "companion" | "item";
export type EntityImageTheme = "light" | "dark";
export type GenerationStatus = "generating" | "completed" | "failed";
export type SubclassVisibility = "public" | "private";
export type SpellSchoolVisibility = "public" | "private";
export type AncestryRarity = "common" | "uncommon" | "exotic";
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

// Per-user runtime feature flags. Unknown or missing flags are disabled.
export const userFeatureFlags = sqliteTable(
  "user_feature_flags",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    feature: text("feature").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.feature] })]
);

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
    likeCount: integer("like_count").notNull().default(0),
    visibility: text("visibility")
      .$type<CollectionVisibility>()
      .default("public"),
  },
  (table) => [index("idx_collections_user_id").on(table.creatorId)]
);

// Encounters table
export const encounters = sqliteTable(
  "encounters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    visibility: text("visibility")
      .$type<EncounterVisibility>()
      .default("public"),
    heroCount: integer("hero_count").notNull().default(4),
    heroLevel: integer("hero_level").notNull().default(1),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_encounters_user_id").on(table.creatorId)]
);

// Random tables table
export const randomTables = sqliteTable(
  "random_tables",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    creatorId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    visibility: text("visibility")
      .$type<RandomTableVisibility>()
      .default("public"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_random_tables_user_id").on(table.creatorId)]
);

// Individual tables within a random table
export const randomSubtables = sqliteTable(
  "random_subtables",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    randomTableId: text("random_table_id")
      .notNull()
      .references(() => randomTables.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    title: text("title").notNull(),
    notation: text("notation").notNull(),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [
    index("idx_random_subtables_random_table_id").on(table.randomTableId),
  ]
);

// Rows within an individual table
export const randomSubtableRows = sqliteTable(
  "random_subtable_rows",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    subtableId: text("subtable_id")
      .notNull()
      .references(() => randomSubtables.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    low: integer("low").notNull(),
    high: integer("high").notNull(),
    result: text("result").notNull(),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [
    index("idx_random_subtable_rows_subtable_id").on(table.subtableId),
  ]
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
    hpPerHero: integer("hp_per_hero"),
    armor: text("armor").$type<ArmorType>().notNull(),
    size: text("size").$type<SizeType>().notNull().default("medium"),
    speed: integer("speed").notNull().default(0),
    fly: integer("fly").notNull().default(0),
    swim: integer("swim").notNull().default(0),
    actions: text("actions", { mode: "json" }).notNull().default("[]"),
    abilities: text("abilities", { mode: "json" }).notNull().default("[]"),
    // Team ("legendary duo") members. Null/empty for ordinary monsters; a
    // non-empty array marks this stat block as a team of 2+ creatures, each
    // holding its own hp/armor/saves/size/abilities/actions.
    members: text("members", { mode: "json" }),
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
    peaceful: text("peaceful").default(""),
    deadly: text("deadly").default(""),
    burrow: integer("burrow").notNull().default(0),
    climb: integer("climb").notNull().default(0),
    teleport: integer("teleport").notNull().default(0),
    minion: integer("minion", { mode: "boolean" }).notNull().default(false),
    hazard: integer("hazard", { mode: "boolean" }).notNull().default(false),
    levelInt: integer("level_int").notNull().default(0),
    role: text("role").$type<MonsterRole>(),
    paperforgeId: text("paperforge_id"),
    isOfficial: integer("is_official", { mode: "boolean" })
      .notNull()
      .default(false),
    likeCount: integer("like_count").notNull().default(0),
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
    imageBackdrop: text("image_backdrop"),
    likeCount: integer("like_count").notNull().default(0),
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
    likeCount: integer("like_count").notNull().default(0),
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
    classId: text("class_id"),
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
    likeCount: integer("like_count").notNull().default(0),
  },
  (table) => [
    index("idx_subclasses_user_id").on(table.userId),
    index("idx_subclasses_class_id").on(table.classId),
  ]
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
    likeCount: integer("like_count").notNull().default(0),
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
    likeCount: integer("like_count").notNull().default(0),
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
    likeCount: integer("like_count").notNull().default(0),
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
    theme: text("theme").$type<EntityImageTheme>().notNull().default("light"),
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
    unique().on(table.entityType, table.entityId, table.theme),
    index("idx_entity_images_status_started").on(
      table.generationStatus,
      table.generationStartedAt
    ),
  ]
);

// Classes table
export type ClassVisibility = "public" | "private";

export const classes = sqliteTable(
  "classes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    subclassNamePreface: text("subclass_name_preface").notNull().default(""),
    description: text("description").notNull(),
    keyStats: text("key_stats", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    hitDie: text("hit_die").notNull(),
    startingHp: integer("starting_hp").notNull(),
    saves: text("saves", { mode: "json" }).notNull().default("{}"),
    armor: text("armor", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    weapons: text("weapons", { mode: "json" })
      .$type<import("@/lib/types").WeaponSpec[]>()
      .notNull()
      .default([]),
    startingGear: text("starting_gear", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    visibility: text("visibility")
      .$type<ClassVisibility>()
      .notNull()
      .default("public"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id, {
      onUpdate: "cascade",
    }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    likeCount: integer("like_count").notNull().default(0),
  },
  (table) => [index("idx_classes_user_id").on(table.userId)]
);

// Class abilities table
export const classAbilities = sqliteTable(
  "class_abilities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    level: integer("level").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [
    index("idx_class_abilities_class_level_order").on(
      table.classId,
      table.level,
      table.orderIndex
    ),
  ]
);

// Class ability lists table
export const classAbilityLists = sqliteTable(
  "class_ability_lists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    characterClass: text("character_class"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onUpdate: "cascade" }),
    sourceId: text("source_id").references(() => sources.id),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_class_ability_lists_user_id").on(table.userId)]
);

// Class ability items table
export const classAbilityItems = sqliteTable(
  "class_ability_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    classAbilityListId: text("class_ability_list_id")
      .notNull()
      .references(() => classAbilityLists.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [
    index("idx_class_ability_items_list_order").on(
      table.classAbilityListId,
      table.orderIndex
    ),
  ]
);

// Join tables

// Classes to class ability lists
export const classesClassAbilityLists = sqliteTable(
  "classes_class_ability_lists",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    abilityListId: text("ability_list_id")
      .notNull()
      .references(() => classAbilityLists.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.classId, table.abilityListId] }),
    index("idx_class_ability_list_links_class_order").on(
      table.classId,
      table.orderIndex
    ),
  ]
);

// Classes awards
export const classesAwards = sqliteTable(
  "classes_awards",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, {
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
  (table) => [primaryKey({ columns: [table.classId, table.awardId] })]
);

// Subclasses to class ability lists
export const subclassesClassAbilityLists = sqliteTable(
  "subclasses_class_ability_lists",
  {
    subclassId: text("subclass_id")
      .notNull()
      .references(() => subclasses.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    abilityListId: text("ability_list_id")
      .notNull()
      .references(() => classAbilityLists.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    orderIndex: integer("order_index").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.subclassId, table.abilityListId] }),
    index("idx_subclass_ability_list_links_subclass_order").on(
      table.subclassId,
      table.orderIndex
    ),
  ]
);

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

// Monsters in encounters
export const monstersEncounters = sqliteTable(
  "monsters_encounters",
  {
    monsterId: text("monster_id")
      .notNull()
      .references(() => monsters.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    encounterId: text("encounter_id")
      .notNull()
      .references(() => encounters.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    quantity: integer("quantity").notNull().default(1),
    isPerHero: integer("is_per_hero", { mode: "boolean" })
      .notNull()
      .default(false),
    heroesPerMonster: integer("heroes_per_monster").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.monsterId, table.encounterId] })]
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

// Classes in collections
export const classesCollections = sqliteTable(
  "classes_collections",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, {
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
  (table) => [primaryKey({ columns: [table.classId, table.collectionId] })]
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

// Entities that support upvote/downvote reactions and abuse reports.
// entity_id is not FK-constrained (SQLite can't FK a polymorphic column);
// referential integrity for it is enforced at the service layer instead.
export type ReactableEntityType =
  | "monster"
  | "item"
  | "companion"
  | "subclass"
  | "class"
  | "spellSchool"
  | "background"
  | "ancestry"
  | "customRule"
  | "collection"
  | "adventure"
  | "encounter";

export type ReactionType = "thumbs_up" | "thumbs_down";

export const reactions = sqliteTable(
  "reactions",
  {
    entityType: text("entity_type").$type<ReactableEntityType>().notNull(),
    entityId: text("entity_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reactionType: text("reaction_type").$type<ReactionType>().notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({
      columns: [
        table.entityType,
        table.entityId,
        table.userId,
        table.reactionType,
      ],
    }),
    index("idx_reactions_entity").on(table.entityType, table.entityId),
  ]
);

export type ReportReason =
  | "inappropriate"
  | "spam"
  | "plagiarism"
  | "inaccurate"
  | "other";

export const reports = sqliteTable(
  "reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    entityType: text("entity_type").$type<ReactableEntityType>().notNull(),
    entityId: text("entity_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    reason: text("reason").$type<ReportReason>().notNull(),
    details: text("details").notNull().default(""),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_reports_entity").on(table.entityType, table.entityId),
    unique().on(table.entityType, table.entityId, table.userId),
  ]
);

export type ReportRow = typeof reports.$inferSelect;
export type ReportInsert = typeof reports.$inferInsert;

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

export const CLASS_DRAFT_NEW_SENTINEL = "__new__";

// Class drafts table (auto-save form state)
export const classDrafts = sqliteTable(
  "class_drafts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    classId: text("class_id").notNull().default(CLASS_DRAFT_NEW_SENTINEL),
    data: text("data", { mode: "json" }).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique().on(table.userId, table.classId),
    index("idx_class_drafts_user_id").on(table.userId),
  ]
);

// Type exports for row types
export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type UserFeatureFlagRow = typeof userFeatureFlags.$inferSelect;
export type MonsterRow = typeof monsters.$inferSelect;
export type MonsterInsert = typeof monsters.$inferInsert;
export type ItemRow = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;
export type CompanionRow = typeof companions.$inferSelect;
export type CompanionInsert = typeof companions.$inferInsert;
export type CollectionRow = typeof collections.$inferSelect;
export type CollectionInsert = typeof collections.$inferInsert;
export type EncounterRow = typeof encounters.$inferSelect;
export type EncounterInsert = typeof encounters.$inferInsert;
export type MonsterEncounterRow = typeof monstersEncounters.$inferSelect;
export type RandomTableRowRecord = typeof randomTables.$inferSelect;
export type RandomSubtableRow = typeof randomSubtables.$inferSelect;
export type RandomSubtableRowRow = typeof randomSubtableRows.$inferSelect;
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
export type ClassRow = typeof classes.$inferSelect;
export type ClassInsert = typeof classes.$inferInsert;
export type ClassAbilityRow = typeof classAbilities.$inferSelect;
export type ClassAbilityInsert = typeof classAbilities.$inferInsert;
export type ClassAbilityListRow = typeof classAbilityLists.$inferSelect;
export type ClassAbilityListInsert = typeof classAbilityLists.$inferInsert;
export type ClassAbilityItemRow = typeof classAbilityItems.$inferSelect;
export type ClassAbilityItemInsert = typeof classAbilityItems.$inferInsert;
export type ClassDraftRow = typeof classDrafts.$inferSelect;
export type ClassDraftInsert = typeof classDrafts.$inferInsert;

// User-authored custom rules. Each rule may link to zero or more official
// rules via `custom_rule_links`.
export type CustomRuleVisibility = "public" | "private";

export const customRules = sqliteTable(
  "custom_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text("name").notNull(),
    keywords: text("keywords").notNull().default(""),
    content: text("content").notNull().default(""),
    visibility: text("visibility")
      .$type<CustomRuleVisibility>()
      .notNull()
      .default("public"),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_custom_rules_user_id").on(table.userId)]
);

export type CustomRuleRow = typeof customRules.$inferSelect;
export type CustomRuleInsert = typeof customRules.$inferInsert;

// Typed links from a user's custom rule to an official rule (by flat slug).
// Official rule-to-rule "related" edges are curated in data/rules/relations.yaml,
// not stored here.
export type CustomRuleRelationType = "replaces" | "augments";

export const customRuleLinks = sqliteTable(
  "custom_rule_links",
  {
    customRuleId: text("custom_rule_id")
      .notNull()
      .references(() => customRules.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ruleSlug: text("rule_slug").notNull(),
    relation: text("relation").$type<CustomRuleRelationType>().notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.customRuleId, table.ruleSlug] }),
    index("idx_custom_rule_links_rule_slug").on(table.ruleSlug),
  ]
);

export type CustomRuleLinkRow = typeof customRuleLinks.$inferSelect;
export type CustomRuleLinkInsert = typeof customRuleLinks.$inferInsert;

export type AdventureVisibility = "public" | "private";
export type AdventureNodeKind =
  | "section"
  | "text"
  | "callout"
  | "image"
  | "encounter"
  | "monsters"
  | "items";
export type AdventureImageExtension = "jpg" | "png" | "webp";
export type AdventureImageStatus =
  | "uploading"
  | "ready"
  | "attached"
  | "deleting";
export type AdventureNodePresentation =
  | "note"
  | "tip"
  | "warning"
  | "rules"
  | "read-aloud"
  | "optional";

export const adventures = sqliteTable(
  "adventures",
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
    remixedFromId: text("remixed_from_id").references(
      (): AnySQLiteColumn => adventures.id,
      { onDelete: "set null", onUpdate: "cascade" }
    ),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    summary: text("summary").notNull().default(""),
    likeCount: integer("like_count").notNull().default(0),
    visibility: text("visibility")
      .$type<AdventureVisibility>()
      .notNull()
      .default("public"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_adventures_user_id").on(table.userId),
    index("idx_adventures_visibility_updated_at").on(
      table.visibility,
      table.updatedAt
    ),
  ]
);

export const adventureImages = sqliteTable(
  "adventure_images",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    extension: text("extension").$type<AdventureImageExtension>().notNull(),
    status: text("status")
      .$type<AdventureImageStatus>()
      .notNull()
      .default("uploading"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_adventure_images_user_id").on(table.userId),
    index("idx_adventure_images_status_created_at").on(
      table.status,
      table.createdAt
    ),
  ]
);

export const adventureNodes = sqliteTable(
  "adventure_nodes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    adventureId: text("adventure_id")
      .notNull()
      .references(() => adventures.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    parentId: text("parent_id").references(
      (): AnySQLiteColumn => adventureNodes.id,
      { onDelete: "cascade", onUpdate: "cascade" }
    ),
    kind: text("kind").$type<AdventureNodeKind>().notNull(),
    orderIndex: integer("order_index").notNull(),
    title: text("title").notNull().default(""),
    content: text("content").notNull().default(""),
    encounterId: text("encounter_id").references(() => encounters.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    imageId: text("image_id").references(() => adventureImages.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    imageExtension: text("image_extension").$type<AdventureImageExtension>(),
    caption: text("caption").notNull().default(""),
    presentation: text("presentation").$type<AdventureNodePresentation>(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    unique("adventure_nodes_image_id_unique").on(table.imageId),
    index("idx_adventure_nodes_parent_order").on(
      table.adventureId,
      table.parentId,
      table.orderIndex
    ),
    index("idx_adventure_nodes_encounter_id").on(table.encounterId),
  ]
);

export const adventureNodeMonsters = sqliteTable(
  "adventure_node_monsters",
  {
    nodeId: text("node_id")
      .notNull()
      .references(() => adventureNodes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    orderIndex: integer("order_index").notNull(),
    monsterId: text("monster_id").references(() => monsters.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.nodeId, table.orderIndex] }),
    unique("adventure_node_monsters_node_entity_unique").on(
      table.nodeId,
      table.monsterId
    ),
    index("idx_adventure_node_monsters_monster_id").on(table.monsterId),
  ]
);

export const adventureNodeItems = sqliteTable(
  "adventure_node_items",
  {
    nodeId: text("node_id")
      .notNull()
      .references(() => adventureNodes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    orderIndex: integer("order_index").notNull(),
    itemId: text("item_id").references(() => items.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
  },
  (table) => [
    primaryKey({ columns: [table.nodeId, table.orderIndex] }),
    unique("adventure_node_items_node_entity_unique").on(
      table.nodeId,
      table.itemId
    ),
    index("idx_adventure_node_items_item_id").on(table.itemId),
  ]
);

export type AdventureRow = typeof adventures.$inferSelect;
export type AdventureInsert = typeof adventures.$inferInsert;
export type AdventureNodeRow = typeof adventureNodes.$inferSelect;
export type AdventureNodeInsert = typeof adventureNodes.$inferInsert;
export type AdventureNodeMonsterRow = typeof adventureNodeMonsters.$inferSelect;
export type AdventureNodeItemRow = typeof adventureNodeItems.$inferSelect;
export type AdventureImageRow = typeof adventureImages.$inferSelect;
