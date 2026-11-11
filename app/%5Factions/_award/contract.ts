import { defineRoute } from "@/lib/contract";

export interface AwardInput {
  name: string;
  abbreviation: string;
  description: string;
  url: string;
  color: string;
  icon: string;
}

export type AwardEntityType =
  | "monster"
  | "item"
  | "companion"
  | "subclass"
  | "school"
  | "ancestry"
  | "background";

export interface AwardAssociationInput {
  entityType: AwardEntityType;
  entityId: string;
  awardId: string;
}

export const createAward = defineRoute<AwardInput, { success: true }>({
  method: "POST",
  path: () => "/_actions/createAward",
});

export const updateAward = defineRoute<
  AwardInput & { id: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/updateAward",
});

export const deleteAward = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteAward",
});

export const addAwardAssociation = defineRoute<
  AwardAssociationInput,
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/addAwardAssociation",
});

export const removeAwardAssociation = defineRoute<
  AwardAssociationInput,
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/removeAwardAssociation",
});
