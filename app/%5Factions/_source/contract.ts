import { defineRoute } from "@/lib/contract";

export interface SourceInput {
  name: string;
  abbreviation: string;
  license: string;
  link: string;
}

export const createSource = defineRoute<SourceInput, { success: true }>({
  method: "POST",
  path: () => "/_actions/createSource",
});

export const updateSource = defineRoute<
  SourceInput & { id: string },
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/updateSource",
});

export const deleteSource = defineRoute<{ id: string }, { success: true }>({
  method: "POST",
  path: () => "/_actions/deleteSource",
});
