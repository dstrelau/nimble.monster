import { defineRoute } from "@/lib/contract";
import type {
  CreateHazardInput,
  CreateMonsterInput,
  UpdateHazardInput,
  UpdateMonsterInput,
} from "@/lib/services/monsters";

export type CreateBestiaryEntryInput =
  | { kind: "monster"; input: CreateMonsterInput }
  | { kind: "hazard"; input: CreateHazardInput };

export type UpdateBestiaryEntryInput =
  | { kind: "monster"; input: UpdateMonsterInput }
  | { kind: "hazard"; input: UpdateHazardInput };

export interface BestiaryMutationResult {
  id: string;
  name: string;
  hazard: boolean;
}

export const createBestiaryEntry = defineRoute<
  CreateBestiaryEntryInput,
  BestiaryMutationResult
>({
  method: "POST",
  path: () => "/_actions/createBestiaryEntry",
});

export const updateBestiaryEntry = defineRoute<
  UpdateBestiaryEntryInput,
  BestiaryMutationResult
>({
  method: "POST",
  path: () => "/_actions/updateBestiaryEntry",
});
