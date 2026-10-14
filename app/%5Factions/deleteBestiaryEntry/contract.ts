import { defineRoute } from "@/lib/contract";

export interface DeleteBestiaryEntryInput {
  id: string;
  kind: "monster" | "hazard";
}

export const deleteBestiaryEntry = defineRoute<
  DeleteBestiaryEntryInput,
  { success: true }
>({
  method: "POST",
  path: () => "/_actions/deleteBestiaryEntry",
});
