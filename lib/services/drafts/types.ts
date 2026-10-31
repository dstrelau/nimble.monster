export const DRAFT_ENTITY_TYPES = ["class", "subclass", "monster"] as const;
export type DraftEntityType = (typeof DRAFT_ENTITY_TYPES)[number];

export interface Draft {
  id: string;
  entityType: DraftEntityType;
  entityId: string | null;
  data: unknown;
  updatedAt: Date;
}
