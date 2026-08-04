import { defineRoute } from "@/lib/contract";
import type { AdventureInput } from "@/lib/db/adventures";

export interface AdventureMutationResult {
  id: string;
  name: string;
}

export interface UpdateAdventureInput {
  id: string;
  adventure: AdventureInput;
}

export const createAdventure = defineRoute<
  AdventureInput,
  AdventureMutationResult
>({
  method: "POST",
  path: () => "/_actions/createAdventure",
});

export const updateAdventure = defineRoute<
  UpdateAdventureInput,
  AdventureMutationResult
>({
  method: "POST",
  path: () => "/_actions/updateAdventure",
});
