import type { FamilyOverview } from "@/lib/types";
import { uuidToIdentifier } from "@/lib/utils/slug";

export const toJsonApiFamily = (f: FamilyOverview) => {
  return {
    type: "families",
    id: uuidToIdentifier(f.id),
    attributes: {
      name: f.name,
      description: f.description,
      abilities: f.abilities.map(({ id, ...ability }) => ability),
      monsterCount: f.monsterCount,
    },
    relationships: {
      creator: {
        data: {
          type: "users",
          id: uuidToIdentifier(f.creator.id),
        },
      },
    },
    links: {
      self: `/api/families/${uuidToIdentifier(f.id)}`,
    },
  };
};
