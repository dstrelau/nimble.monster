import type { Jsonify } from "@/app/%5Factions/statblockPickerSearch/contract";
import type { CollectionOverview } from "@/lib/types";

export function reviveCollectionOverview(
  collection: Jsonify<CollectionOverview>
): CollectionOverview {
  return {
    ...collection,
    createdAt: collection.createdAt
      ? new Date(collection.createdAt)
      : undefined,
    monsters: collection.monsters.map((monster) => ({
      ...monster,
      createdAt: new Date(monster.createdAt),
    })),
    items: collection.items.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })),
    ancestries: collection.ancestries.map((ancestry) => ({
      ...ancestry,
      createdAt: new Date(ancestry.createdAt),
      updatedAt: new Date(ancestry.updatedAt),
    })),
    backgrounds: collection.backgrounds.map((background) => ({
      ...background,
      createdAt: new Date(background.createdAt),
      updatedAt: new Date(background.updatedAt),
    })),
    subclasses: collection.subclasses.map((subclass) => ({
      ...subclass,
      createdAt: new Date(subclass.createdAt),
    })),
    spellSchools: collection.spellSchools.map((school) => ({
      ...school,
      createdAt: new Date(school.createdAt),
    })),
    classes: collection.classes.map((characterClass) => ({
      ...characterClass,
      createdAt: new Date(characterClass.createdAt),
    })),
  };
}
