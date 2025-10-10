import { toJsonApiItem } from "@/lib/services/items/converters";
import { toJsonApiMonster } from "@/lib/services/monsters/converters";
import type { Collection, CollectionOverview } from "@/lib/types";
import { uuidToIdentifier } from "@/lib/utils/slug";

export const toJsonApiCollection = (c: CollectionOverview) => {
  return {
    type: "collections",
    id: uuidToIdentifier(c.id),
    attributes: {
      name: c.name,
      description: c.description,
      createdAt: c.createdAt?.toISOString(),
      monsterCount: c.standardCount + c.legendaryCount,
      itemCount: c.itemCount,
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: c.creator.username,
        },
      },
    },
    links: {
      self: `/api/collections/${uuidToIdentifier(c.id)}`,
    },
  };
};

export const toJsonApiCollectionWithMonsters = (c: Collection) => {
  const base = {
    type: "collections",
    id: uuidToIdentifier(c.id),
    attributes: {
      name: c.name,
      description: c.description,
      createdAt: c.createdAt?.toISOString(),
      monsterCount: c.standardCount + c.legendaryCount,
      itemCount: c.itemCount,
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: c.creator.username,
        },
      },
      monsters: {
        data: c.monsters.map((m) => ({
          type: "monsters",
          id: uuidToIdentifier(m.id),
        })),
      },
    },
    links: {
      self: `/api/collections/${uuidToIdentifier(c.id)}`,
    },
  };

  const included = c.monsters.map(toJsonApiMonster);

  return { data: base, included };
};

export const toJsonApiCollectionWithItems = (c: Collection) => {
  const base = {
    type: "collections",
    id: uuidToIdentifier(c.id),
    attributes: {
      name: c.name,
      description: c.description,
      createdAt: c.createdAt?.toISOString(),
      monsterCount: c.standardCount + c.legendaryCount,
      itemCount: c.itemCount,
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: c.creator.username,
        },
      },
      items: {
        data: c.items.map((i) => ({
          type: "items",
          id: uuidToIdentifier(i.id),
        })),
      },
    },
    links: {
      self: `/api/collections/${uuidToIdentifier(c.id)}`,
    },
  };

  const included = c.items.map(toJsonApiItem);

  return { data: base, included };
};

export const toJsonApiCollectionWithBoth = (c: Collection) => {
  const base = {
    type: "collections",
    id: uuidToIdentifier(c.id),
    attributes: {
      name: c.name,
      description: c.description,
      createdAt: c.createdAt?.toISOString(),
      monsterCount: c.standardCount + c.legendaryCount,
      itemCount: c.itemCount,
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: c.creator.username,
        },
      },
      monsters: {
        data: c.monsters.map((m) => ({
          type: "monsters",
          id: uuidToIdentifier(m.id),
        })),
      },
      items: {
        data: c.items.map((i) => ({
          type: "items",
          id: uuidToIdentifier(i.id),
        })),
      },
    },
    links: {
      self: `/api/collections/${uuidToIdentifier(c.id)}`,
    },
  };

  const included = [
    ...c.monsters.map(toJsonApiMonster),
    ...c.items.map(toJsonApiItem),
  ];

  return { data: base, included };
};
