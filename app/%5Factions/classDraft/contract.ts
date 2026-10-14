import { defineRoute } from "@/lib/contract";

export interface ClassDraftInput {
  classId: string | null;
}

export interface SaveClassDraftInput extends ClassDraftInput {
  data: unknown;
}

export const getClassDraft = defineRoute<
  ClassDraftInput,
  { draft: { data: unknown; updatedAt: string } | null }
>({
  method: "GET",
  path: ({ classId }) =>
    classId === null
      ? "/_actions/classDraft"
      : `/_actions/classDraft?classId=${encodeURIComponent(classId)}`,
});

export const saveClassDraft = defineRoute<
  SaveClassDraftInput,
  { updatedAt: string }
>({ method: "POST", path: () => "/_actions/classDraft" });

export const deleteClassDraft = defineRoute<ClassDraftInput, { success: true }>(
  {
    method: "DELETE",
    path: () => "/_actions/classDraft",
  }
);
