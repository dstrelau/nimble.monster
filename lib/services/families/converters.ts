import type { Ability } from "@/lib/types";
import { uuidToIdentifier } from "@/lib/utils/slug";
import type { FamilyOverview } from "./types";

export const toJsonApiFamily = (family: FamilyOverview) => {
  const id = uuidToIdentifier(family.id);

  return {
    type: "families",
    id,
    attributes: {
      name: family.name,
      description: family.description,
      abilities: family.abilities.map((a: Ability) => ({
        name: a.name,
        description: a.description,
      })),
    },
    links: {
      self: `/api/families/${id}`,
    },
  };
};

export const toJsonApiFamilyReference = (family: FamilyOverview) => {
  return {
    type: "families",
    id: uuidToIdentifier(family.id),
  };
};
