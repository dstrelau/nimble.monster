import { defineRoute } from "@/lib/contract";
import type { DraftEntityType } from "@/lib/services/drafts/types";

export interface DraftInput {
  entityType: DraftEntityType;
  /** Null for an entity that has not been saved yet. */
  entityId: string | null;
}

export interface SaveDraftInput extends DraftInput {
  data: unknown;
}

export const getDraft = defineRoute<
  DraftInput,
  { draft: { data: unknown; updatedAt: string } | null }
>({
  method: "GET",
  path: ({ entityType, entityId }) => {
    const params = new URLSearchParams({ entityType });
    if (entityId !== null) params.set("entityId", entityId);
    return `/_actions/draft?${params}`;
  },
});

export const saveDraft = defineRoute<SaveDraftInput, { updatedAt: string }>({
  method: "POST",
  path: () => "/_actions/draft",
});

export const deleteDraft = defineRoute<DraftInput, { success: true }>({
  method: "DELETE",
  path: () => "/_actions/draft",
});
