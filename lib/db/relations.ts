import { relations } from "drizzle-orm";
import {
  ancestries,
  ancestriesAwards,
  awards,
  backgrounds,
  backgroundsAwards,
  collections,
  companions,
  companionsAwards,
  conditions,
  families,
  items,
  itemsAwards,
  itemsCollections,
  monsters,
  monstersAwards,
  monstersCollections,
  monstersConditions,
  monstersFamilies,
  sources,
  spellSchools,
  spellSchoolsAwards,
  spellSchoolsCollections,
  spells,
  subclassAbilities,
  subclasses,
  subclassesAwards,
  users,
} from "./schema";

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  companions: many(companions),
  conditions: many(conditions),
  items: many(items),
  monsters: many(monsters),
  subclasses: many(subclasses),
  families: many(families),
  spellSchools: many(spellSchools),
  backgrounds: many(backgrounds),
  ancestries: many(ancestries),
}));

// Collection relations
export const collectionsRelations = relations(collections, ({ one, many }) => ({
  creator: one(users, {
    fields: [collections.creatorId],
    references: [users.id],
  }),
  monsterCollections: many(monstersCollections),
  itemCollections: many(itemsCollections),
  spellSchoolCollections: many(spellSchoolsCollections),
}));

// Monster relations
export const monstersRelations = relations(monsters, ({ one, many }) => ({
  creator: one(users, {
    fields: [monsters.userId],
    references: [users.id],
  }),
  source: one(sources, {
    fields: [monsters.sourceId],
    references: [sources.id],
  }),
  remixedFrom: one(monsters, {
    fields: [monsters.remixedFromId],
    references: [monsters.id],
    relationName: "monsterRemix",
  }),
  remixes: many(monsters, { relationName: "monsterRemix" }),
  monsterCollections: many(monstersCollections),
  monsterConditions: many(monstersConditions),
  monsterFamilies: many(monstersFamilies),
  monsterAwards: many(monstersAwards),
}));

// Item relations
export const itemsRelations = relations(items, ({ one, many }) => ({
  creator: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
  source: one(sources, {
    fields: [items.sourceId],
    references: [sources.id],
  }),
  remixedFrom: one(items, {
    fields: [items.remixedFromId],
    references: [items.id],
    relationName: "itemRemix",
  }),
  remixes: many(items, { relationName: "itemRemix" }),
  itemCollections: many(itemsCollections),
  itemAwards: many(itemsAwards),
}));

// Companion relations
export const companionsRelations = relations(companions, ({ one, many }) => ({
  creator: one(users, {
    fields: [companions.userId],
    references: [users.id],
  }),
  source: one(sources, {
    fields: [companions.sourceId],
    references: [sources.id],
  }),
  companionAwards: many(companionsAwards),
}));

// Family relations
export const familiesRelations = relations(families, ({ one, many }) => ({
  creator: one(users, {
    fields: [families.creatorId],
    references: [users.id],
  }),
  monsterFamilies: many(monstersFamilies),
}));

// Condition relations
export const conditionsRelations = relations(conditions, ({ one, many }) => ({
  creator: one(users, {
    fields: [conditions.creatorId],
    references: [users.id],
  }),
  monsterConditions: many(monstersConditions),
}));

// Subclass relations
export const subclassesRelations = relations(subclasses, ({ one, many }) => ({
  creator: one(users, {
    fields: [subclasses.userId],
    references: [users.id],
  }),
  source: one(sources, {
    fields: [subclasses.sourceId],
    references: [sources.id],
  }),
  abilities: many(subclassAbilities),
  subclassAwards: many(subclassesAwards),
}));

// Subclass ability relations
export const subclassAbilitiesRelations = relations(
  subclassAbilities,
  ({ one }) => ({
    subclass: one(subclasses, {
      fields: [subclassAbilities.subclassId],
      references: [subclasses.id],
    }),
  })
);

// Spell relations
export const spellsRelations = relations(spells, ({ one }) => ({
  school: one(spellSchools, {
    fields: [spells.schoolId],
    references: [spellSchools.id],
  }),
}));

// Spell school relations
export const spellSchoolsRelations = relations(
  spellSchools,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [spellSchools.userId],
      references: [users.id],
    }),
    source: one(sources, {
      fields: [spellSchools.sourceId],
      references: [sources.id],
    }),
    spells: many(spells),
    spellSchoolCollections: many(spellSchoolsCollections),
    schoolAwards: many(spellSchoolsAwards),
  })
);

// Background relations
export const backgroundsRelations = relations(backgrounds, ({ one, many }) => ({
  creator: one(users, {
    fields: [backgrounds.userId],
    references: [users.id],
  }),
  source: one(sources, {
    fields: [backgrounds.sourceId],
    references: [sources.id],
  }),
  backgroundAwards: many(backgroundsAwards),
}));

// Ancestry relations
export const ancestriesRelations = relations(ancestries, ({ one, many }) => ({
  creator: one(users, {
    fields: [ancestries.userId],
    references: [users.id],
  }),
  source: one(sources, {
    fields: [ancestries.sourceId],
    references: [sources.id],
  }),
  ancestryAwards: many(ancestriesAwards),
}));

// Source relations
export const sourcesRelations = relations(sources, ({ many }) => ({
  monsters: many(monsters),
  items: many(items),
  companions: many(companions),
  subclasses: many(subclasses),
  spellSchools: many(spellSchools),
  backgrounds: many(backgrounds),
  ancestries: many(ancestries),
}));

// Award relations
export const awardsRelations = relations(awards, ({ many }) => ({
  monsterAwards: many(monstersAwards),
  itemAwards: many(itemsAwards),
  companionAwards: many(companionsAwards),
  subclassAwards: many(subclassesAwards),
  schoolAwards: many(spellSchoolsAwards),
  backgroundAwards: many(backgroundsAwards),
  ancestryAwards: many(ancestriesAwards),
}));

// Join table relations

export const monstersCollectionsRelations = relations(
  monstersCollections,
  ({ one }) => ({
    monster: one(monsters, {
      fields: [monstersCollections.monsterId],
      references: [monsters.id],
    }),
    collection: one(collections, {
      fields: [monstersCollections.collectionId],
      references: [collections.id],
    }),
  })
);

export const itemsCollectionsRelations = relations(
  itemsCollections,
  ({ one }) => ({
    item: one(items, {
      fields: [itemsCollections.itemId],
      references: [items.id],
    }),
    collection: one(collections, {
      fields: [itemsCollections.collectionId],
      references: [collections.id],
    }),
  })
);

export const spellSchoolsCollectionsRelations = relations(
  spellSchoolsCollections,
  ({ one }) => ({
    spellSchool: one(spellSchools, {
      fields: [spellSchoolsCollections.spellSchoolId],
      references: [spellSchools.id],
    }),
    collection: one(collections, {
      fields: [spellSchoolsCollections.collectionId],
      references: [collections.id],
    }),
  })
);

export const monstersConditionsRelations = relations(
  monstersConditions,
  ({ one }) => ({
    monster: one(monsters, {
      fields: [monstersConditions.monsterId],
      references: [monsters.id],
    }),
    condition: one(conditions, {
      fields: [monstersConditions.conditionId],
      references: [conditions.id],
    }),
  })
);

export const monstersFamiliesRelations = relations(
  monstersFamilies,
  ({ one }) => ({
    monster: one(monsters, {
      fields: [monstersFamilies.monsterId],
      references: [monsters.id],
    }),
    family: one(families, {
      fields: [monstersFamilies.familyId],
      references: [families.id],
    }),
  })
);

export const monstersAwardsRelations = relations(monstersAwards, ({ one }) => ({
  monster: one(monsters, {
    fields: [monstersAwards.monsterId],
    references: [monsters.id],
  }),
  award: one(awards, {
    fields: [monstersAwards.awardId],
    references: [awards.id],
  }),
}));

export const itemsAwardsRelations = relations(itemsAwards, ({ one }) => ({
  item: one(items, {
    fields: [itemsAwards.itemId],
    references: [items.id],
  }),
  award: one(awards, {
    fields: [itemsAwards.awardId],
    references: [awards.id],
  }),
}));

export const companionsAwardsRelations = relations(
  companionsAwards,
  ({ one }) => ({
    companion: one(companions, {
      fields: [companionsAwards.companionId],
      references: [companions.id],
    }),
    award: one(awards, {
      fields: [companionsAwards.awardId],
      references: [awards.id],
    }),
  })
);

export const subclassesAwardsRelations = relations(
  subclassesAwards,
  ({ one }) => ({
    subclass: one(subclasses, {
      fields: [subclassesAwards.subclassId],
      references: [subclasses.id],
    }),
    award: one(awards, {
      fields: [subclassesAwards.awardId],
      references: [awards.id],
    }),
  })
);

export const spellSchoolsAwardsRelations = relations(
  spellSchoolsAwards,
  ({ one }) => ({
    school: one(spellSchools, {
      fields: [spellSchoolsAwards.schoolId],
      references: [spellSchools.id],
    }),
    award: one(awards, {
      fields: [spellSchoolsAwards.awardId],
      references: [awards.id],
    }),
  })
);

export const backgroundsAwardsRelations = relations(
  backgroundsAwards,
  ({ one }) => ({
    background: one(backgrounds, {
      fields: [backgroundsAwards.backgroundId],
      references: [backgrounds.id],
    }),
    award: one(awards, {
      fields: [backgroundsAwards.awardId],
      references: [awards.id],
    }),
  })
);

export const ancestriesAwardsRelations = relations(
  ancestriesAwards,
  ({ one }) => ({
    ancestry: one(ancestries, {
      fields: [ancestriesAwards.ancestryId],
      references: [ancestries.id],
    }),
    award: one(awards, {
      fields: [ancestriesAwards.awardId],
      references: [awards.id],
    }),
  })
);
